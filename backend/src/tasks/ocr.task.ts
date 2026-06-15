import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { Document, OcrStatus } from '../common/entities/document.entity';
import { OcrVersion } from '../common/entities/ocr-version.entity';
import { IncrementalChange } from '../ocr/ocr.service';

interface OcrServiceResponse {
  success: boolean;
  text?: string;
  confidence?: number;
  engine?: string;
  processingTime?: number;
  error?: string;
}

@Injectable()
export class OcrTaskService implements OnModuleInit {
  private readonly logger = new Logger(OcrTaskService.name);
  private readonly ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://localhost:3001/ocr';
  private readonly checkInterval = 30000;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(OcrVersion)
    private ocrVersionRepository: Repository<OcrVersion>,
  ) {}

  onModuleInit() {
    this.logger.log('OCR定时任务模块已初始化');
    this.start();
  }

  start() {
    if (this.intervalId) {
      this.logger.warn('OCR定时任务已在运行');
      return;
    }
    this.logger.log(`启动OCR定时任务，检查间隔: ${this.checkInterval / 1000}秒`);
    this.checkPendingDocuments();
    this.intervalId = setInterval(() => {
      this.checkPendingDocuments();
    }, this.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('OCR定时任务已停止');
    }
  }

  private async checkPendingDocuments() {
    if (this.isRunning) {
      this.logger.debug('上一次OCR检查尚未完成，跳过本次检查');
      return;
    }

    this.isRunning = true;
    try {
      this.logger.debug('开始检查待OCR处理的文档');
      
      const pendingDocuments = await this.documentRepository.find({
        where: { ocrStatus: 'pending' as OcrStatus },
        relations: ['ocrVersions'],
        take: 5,
      });

      if (pendingDocuments.length === 0) {
        this.logger.debug('没有待处理的OCR文档');
        return;
      }

      this.logger.log(`发现 ${pendingDocuments.length} 个待处理的OCR文档`);

      for (const document of pendingDocuments) {
        await this.processDocument(document);
      }
    } catch (error) {
      this.logger.error(`检查待处理文档时发生错误: ${error.message}`, error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  private async processDocument(document: Document) {
    this.logger.log(`开始处理文档OCR，文档ID: ${document.id}，文件名: ${document.documentName}`);

    try {
      await this.documentRepository.update(document.id, { ocrStatus: 'processing' as OcrStatus });
      this.logger.debug(`文档状态更新为处理中，文档ID: ${document.id}`);

      const ocrResult = await this.callOcrService(document);
      
      if (!ocrResult.success || !ocrResult.text) {
        throw new Error(ocrResult.error || 'OCR服务返回失败');
      }

      this.logger.debug(`OCR识别完成，置信度: ${ocrResult.confidence}%，耗时: ${ocrResult.processingTime}ms，文档ID: ${document.id}`);

      const latestOcrVersion = document.ocrVersions?.length > 0
        ? document.ocrVersions.reduce((latest, v) => v.versionNumber > latest.versionNumber ? v : latest, document.ocrVersions[0])
        : null;

      let isIncremental = false;
      let incrementalChanges: IncrementalChange[] = [];

      if (latestOcrVersion) {
        this.logger.debug(`检测到现有OCR版本，版本号: ${latestOcrVersion.versionNumber}，文档ID: ${document.id}`);
        incrementalChanges = this.calculateIncrementalChanges(latestOcrVersion.ocrText, ocrResult.text);
        isIncremental = incrementalChanges.length > 0;
        this.logger.log(`增量差异检测完成，差异数: ${incrementalChanges.length}，是否增量更新: ${isIncremental}，文档ID: ${document.id}`);
      } else {
        this.logger.log(`文档无现有OCR版本，将创建初始版本，文档ID: ${document.id}`);
      }

      const versionNumber = latestOcrVersion ? latestOcrVersion.versionNumber + 1 : 1;

      const ocrVersion = this.ocrVersionRepository.create({
        documentId: document.id,
        versionNumber,
        ocrText: ocrResult.text,
        ocrEngine: ocrResult.engine || 'Tesseract-Simulator',
        confidenceScore: ocrResult.confidence || 0,
        isIncremental,
        incrementalChanges: JSON.stringify(incrementalChanges),
        processedAt: new Date(),
      });

      const savedOcrVersion = await this.ocrVersionRepository.save(ocrVersion);
      this.logger.log(`OCR版本创建成功，版本号: ${versionNumber}，OCR版本ID: ${savedOcrVersion.id}，文档ID: ${document.id}`);

      await this.documentRepository.update(document.id, {
        ocrStatus: 'completed' as OcrStatus,
        latestOcrVersionId: savedOcrVersion.id,
      });
      this.logger.log(`文档OCR状态更新为完成，最新OCR版本ID: ${savedOcrVersion.id}，文档ID: ${document.id}`);

    } catch (error) {
      this.logger.error(`OCR处理失败，文档ID: ${document.id}，错误: ${error.message}`, error.stack);
      await this.documentRepository.update(document.id, { ocrStatus: 'failed' as OcrStatus });
    }
  }

  private async callOcrService(document: Document): Promise<OcrServiceResponse> {
    this.logger.debug(`调用OCR服务，文档ID: ${document.id}，URL: ${this.ocrServiceUrl}`);

    return new Promise((resolve) => {
      try {
        const url = new URL(this.ocrServiceUrl);
        const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
        
        let fileBuffer = Buffer.from('');
        if (document.filePath) {
          const fullPath = path.join(process.cwd(), document.filePath);
          if (fs.existsSync(fullPath)) {
            fileBuffer = fs.readFileSync(fullPath);
            this.logger.debug(`读取文件内容，文件路径: ${fullPath}，文档ID: ${document.id}`);
          } else {
            this.logger.warn(`文件不存在，使用空内容，文档ID: ${document.id}，文件路径: ${fullPath}`);
          }
        } else {
          this.logger.warn(`文档无文件路径，使用空内容，文档ID: ${document.id}`);
        }

        const preamble = Buffer.from(
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${encodeURIComponent(document.documentName)}"\r\n` +
          'Content-Type: application/octet-stream\r\n' +
          '\r\n'
        );
        
        const postamble = Buffer.from(`\r\n--${boundary}--\r\n`);
        const totalLength = preamble.length + fileBuffer.length + postamble.length;

        const options: http.RequestOptions = {
          hostname: url.hostname,
          port: parseInt(url.port) || 80,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': totalLength,
          },
          timeout: 10000,
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const result = JSON.parse(data) as OcrServiceResponse;
              resolve(result);
            } catch (error) {
              resolve({
                success: false,
                error: `解析OCR响应失败: ${error.message}`,
              });
            }
          });
        });

        req.on('error', (error) => {
          this.logger.error(`调用OCR服务失败，文档ID: ${document.id}，错误: ${error.message}`);
          resolve({
            success: false,
            error: error.message,
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            success: false,
            error: 'OCR服务请求超时',
          });
        });

        req.write(preamble);
        req.write(fileBuffer);
        req.end(postamble);

      } catch (error) {
        this.logger.error(`调用OCR服务异常，文档ID: ${document.id}，错误: ${error.message}`);
        resolve({
          success: false,
          error: error.message,
        });
      }
    });
  }

  private calculateIncrementalChanges(oldText: string, newText: string): IncrementalChange[] {
    const changes: IncrementalChange[] = [];

    if (oldText === newText) {
      return changes;
    }

    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const maxLines = Math.max(oldLines.length, newLines.length);
    let position = 0;

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine !== newLine) {
        if (oldLine && !newLine) {
          changes.push({
            type: 'deleted',
            oldText: oldLine,
            position,
            length: oldLine.length,
          });
        } else if (!oldLine && newLine) {
          changes.push({
            type: 'added',
            newText: newLine,
            position,
            length: newLine.length,
          });
        } else {
          changes.push({
            type: 'modified',
            oldText: oldLine,
            newText: newLine,
            position,
            length: Math.max(oldLine.length, newLine.length),
          });
        }
      }
      position += (newLine.length + 1);
    }

    return changes;
  }
}
