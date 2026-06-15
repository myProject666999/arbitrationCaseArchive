import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, OcrStatus } from '../common/entities/document.entity';
import { OcrVersion } from '../common/entities/ocr-version.entity';
import { User } from '../common/entities/user.entity';

export interface OcrProcessResult {
  success: boolean;
  ocrVersionId?: number;
  versionNumber?: number;
  message: string;
  isIncremental?: boolean;
  incrementalChanges?: string;
}

export interface IncrementalChange {
  type: 'added' | 'modified' | 'deleted';
  oldText?: string;
  newText?: string;
  position: number;
  length: number;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  private readonly mockOcrTexts = [
    '仲裁申请书\n申请人：张三，男，1980年1月1日出生，汉族，住北京市朝阳区xxx路xxx号。\n被申请人：李四，男，1975年5月5日出生，汉族，住北京市海淀区xxx路xxx号。\n仲裁请求：\n1. 裁决被申请人支付合同违约金人民币50万元；\n2. 裁决被申请人承担本案仲裁费用。\n事实与理由：\n申请人与被申请人于2023年1月1日签订《买卖合同》，约定申请人向被申请人购买货物，总价款人民币200万元。合同签订后，申请人依约支付了全部货款，但被申请人未能按约定时间交付货物，已构成违约。根据合同约定，被申请人应按日支付逾期交货违约金。截至2023年6月1日，被申请人已逾期交货150天，应支付违约金人民币50万元。为维护申请人的合法权益，特向贵委申请仲裁。',
    '答辩书\n答辩人：李四，男，1975年5月5日出生，汉族，住北京市海淀区xxx路xxx号。\n就申请人张三诉答辩人买卖合同纠纷一案，答辩人现提出如下答辩意见：\n一、答辩人未能按约定时间交货是由于不可抗力原因造成的。2023年2月，答辩人所在地发生重大疫情，政府实施了封控管理，导致工厂停产，无法正常生产和交货。根据《民法典》第一百八十条的规定，因不可抗力不能履行民事义务的，不承担民事责任。\n二、即使答辩人应承担违约责任，申请人主张的违约金也过高，请求予以适当减少。根据合同约定，违约金按日万分之五计算，明显高于申请人的实际损失。根据《民法典》第五百八十五条的规定，约定的违约金过分高于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以适当减少。\n综上，请求仲裁庭依法驳回申请人的仲裁请求或适当减少违约金数额。',
    '证据清单\n提交人：张三\n提交日期：2023年6月1日\n序号 证据名称 证据来源 证明内容\n1 买卖合同 双方签订 证明申请人与被申请人之间存在买卖合同关系，以及双方的权利义务\n2 付款凭证 银行出具 证明申请人已依约支付全部货款人民币200万元\n3 交货通知书 被申请人出具 证明被通知应于2023年2月1日前交货\n4 催告函 申请人发出 证明申请人多次催告被申请人交货\n5 损失计算表 申请人制作 证明因被申请人逾期交货给申请人造成的损失\n6 聊天记录 双方微信 证明被申请人承认逾期交货的事实',
    '仲裁裁决书\n（2023）京仲字第xxx号\n申请人：张三，男，1980年1月1日出生，汉族，住北京市朝阳区xxx路xxx号。\n被申请人：李四，男，1975年5月5日出生，汉族，住北京市海淀区xxx路xxx号。\n北京仲裁委员会（以下简称本委）根据申请人张三与被申请人李四下2023年1月1日签订的《买卖合同》中的仲裁条款，以及申请人于2023年6月1日向本委提交的仲裁申请，于2023年6月10日受理了本案。\n本案由仲裁员王某某独任审理。本委于2023年7月1日依法不公开开庭审理了本案。申请人张三及其委托代理人赵某某，被申请人李四及其委托代理人孙某某到庭参加了庭审。本案现已审理终结。\n经审理查明：\n一、2023年1月1日，申请人与被申请人签订《买卖合同》，约定申请人向被申请人购买货物，总价款人民币200万元，被申请人应于2023年2月1日前交货，逾期交货按日万分之五支付违约金。\n二、合同签订后，申请人于2023年1月5日支付了全部货款人民币200万元。\n三、被申请人因疫情原因未能按约定时间交货，实际交货时间为2023年4月15日，逾期交货73天。\n本委认为：\n一、关于不可抗力。被申请人主张因疫情原因未能交货属于不可抗力，本委予以采信。但被申请人在疫情缓解后未及时履行交货义务，存在一定过错。\n二、关于违约金。申请人主张的违约金计算标准过高，本委酌情调整为按日万分之三计算。\n裁决如下：\n一、被申请人李四于本裁决书送达之日起十日内支付申请人张三违约金人民币43.8万元；\n二、本案仲裁费用人民币2万元，由申请人承担30%即6000元，被申请人承担70%即14000元。\n本裁决为终局裁决，自作出之日起发生法律效力。\n仲裁员：王某某\n2023年7月15日',
    '借款合同\n出借人（甲方）：王五，男，1978年3月3日出生，汉族，住北京市西城区xxx路xxx号。\n借款人（乙方）：赵六，男，1982年8月8日出生，汉族，住北京市东城区xxx路xxx号。\n保证人（丙方）：孙七，男，1970年10月10日出生，汉族，住北京市丰台区xxx路xxx号。\n鉴于乙方因资金周转需要向甲方借款，丙方同意为乙方的借款提供连带责任保证担保，三方经协商一致，达成如下协议：\n第一条 借款金额：人民币100万元整。\n第二条 借款期限：自2023年1月1日起至2023年6月30日止。\n第三条 借款利率：年利率12%，按月付息，到期还本。\n第四条 保证条款：丙方同意为乙方的借款提供连带责任保证担保，保证范围包括借款本金、利息、违约金以及甲方实现债权的费用，保证期间为债务履行期限届满之日起两年。\n第五条 违约责任：乙方如逾期还款，应按日万分之五支付逾期违约金。\n第六条 争议解决：因本合同引起的或与本合同有关的任何争议，均提交北京仲裁委员会仲裁。\n本合同一式三份，甲、乙、丙三方各执一份，自各方签字之日起生效。\n甲方（签字）：王五 日期：2023年1月1日\n乙方（签字）：赵六 日期：2023年1月1日\n丙方（签字）：孙七 日期：2023年1月1日',
  ];

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(OcrVersion)
    private ocrVersionRepository: Repository<OcrVersion>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async processOcr(documentId: number, userId: number): Promise<OcrProcessResult> {
    this.logger.debug(`开始OCR处理，文档ID: ${documentId}，用户ID: ${userId}`);

    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['ocrVersions'],
    });

    if (!document) {
      this.logger.error(`文档不存在，ID: ${documentId}`);
      throw new NotFoundException('文档不存在');
    }

    if (document.ocrStatus === 'processing') {
      this.logger.warn(`文档正在OCR处理中，ID: ${documentId}`);
      return { success: false, message: '文档正在OCR处理中，请稍后再试' };
    }

    try {
      await this.documentRepository.update(documentId, { ocrStatus: 'processing' });
      this.logger.log(`文档OCR状态更新为处理中，ID: ${documentId}`);

      const ocrText = this.generateMockOcrText(document);
      this.logger.debug(`生成OCR文本，长度: ${ocrText.length}，文档ID: ${documentId}`);

      const latestOcrVersion = document.ocrVersions?.length > 0
        ? document.ocrVersions.reduce((latest, v) => v.versionNumber > latest.versionNumber ? v : latest, document.ocrVersions[0])
        : null;

      let isIncremental = false;
      let incrementalChanges: IncrementalChange[] = [];

      if (latestOcrVersion) {
        this.logger.debug(`检测到现有OCR版本，版本号: ${latestOcrVersion.versionNumber}，文档ID: ${documentId}`);
        const diff = this.calculateIncrementalChanges(latestOcrVersion.ocrText, ocrText);
        incrementalChanges = diff;
        isIncremental = diff.length > 0;
        this.logger.log(`增量差异检测完成，差异数: ${diff.length}，是否增量更新: ${isIncremental}，文档ID: ${documentId}`);
      } else {
        this.logger.log(`文档无现有OCR版本，将创建初始版本，文档ID: ${documentId}`);
      }

      const versionNumber = latestOcrVersion ? latestOcrVersion.versionNumber + 1 : 1;
      const confidenceScore = this.generateConfidenceScore();

      const ocrVersion = this.ocrVersionRepository.create({
        documentId: document.id,
        versionNumber,
        ocrText,
        ocrEngine: 'mock-ocr-engine-v1.0',
        confidenceScore,
        isIncremental,
        incrementalChanges: JSON.stringify(incrementalChanges),
        processedById: userId,
        processedAt: new Date(),
      });

      const savedOcrVersion = await this.ocrVersionRepository.save(ocrVersion);
      this.logger.log(`OCR版本创建成功，版本号: ${versionNumber}，OCR版本ID: ${savedOcrVersion.id}，文档ID: ${documentId}`);

      await this.documentRepository.update(documentId, {
        ocrStatus: 'completed',
        latestOcrVersionId: savedOcrVersion.id,
      });
      this.logger.log(`文档OCR状态更新为完成，最新OCR版本ID: ${savedOcrVersion.id}，文档ID: ${documentId}`);

      return {
        success: true,
        ocrVersionId: savedOcrVersion.id,
        versionNumber,
        message: 'OCR处理完成',
        isIncremental,
        incrementalChanges: JSON.stringify(incrementalChanges),
      };
    } catch (error) {
      this.logger.error(`OCR处理失败，文档ID: ${documentId}，错误: ${error.message}`, error.stack);
      await this.documentRepository.update(documentId, { ocrStatus: 'failed' });
      throw new BadRequestException(`OCR处理失败: ${error.message}`);
    }
  }

  async getOcrVersions(documentId: number): Promise<OcrVersion[]> {
    this.logger.debug(`获取OCR版本列表，文档ID: ${documentId}`);

    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      this.logger.error(`文档不存在，ID: ${documentId}`);
      throw new NotFoundException('文档不存在');
    }

    const versions = await this.ocrVersionRepository.find({
      where: { documentId },
      order: { versionNumber: 'DESC' },
      relations: ['processedBy'],
    });

    this.logger.debug(`获取到OCR版本数量: ${versions.length}，文档ID: ${documentId}`);
    return versions;
  }

  async getOcrVersion(ocrVersionId: number): Promise<OcrVersion> {
    this.logger.debug(`获取OCR版本详情，OCR版本ID: ${ocrVersionId}`);

    const ocrVersion = await this.ocrVersionRepository.findOne({
      where: { id: ocrVersionId },
      relations: ['document', 'processedBy'],
    });

    if (!ocrVersion) {
      this.logger.error(`OCR版本不存在，ID: ${ocrVersionId}`);
      throw new NotFoundException('OCR版本不存在');
    }

    return ocrVersion;
  }

  async compareVersions(versionId1: number, versionId2: number): Promise<{ changes: IncrementalChange[]; oldText: string; newText: string }> {
    this.logger.debug(`比较OCR版本，版本1: ${versionId1}，版本2: ${versionId2}`);

    const [v1, v2] = await Promise.all([
      this.ocrVersionRepository.findOne({ where: { id: versionId1 } }),
      this.ocrVersionRepository.findOne({ where: { id: versionId2 } }),
    ]);

    if (!v1 || !v2) {
      this.logger.error(`OCR版本不存在，版本1: ${versionId1}，版本2: ${versionId2}`);
      throw new NotFoundException('OCR版本不存在');
    }

    if (v1.documentId !== v2.documentId) {
      this.logger.error(`版本不属于同一文档，版本1文档ID: ${v1.documentId}，版本2文档ID: ${v2.documentId}`);
      throw new BadRequestException('只能比较同一文档的OCR版本');
    }

    const changes = this.calculateIncrementalChanges(v1.ocrText, v2.ocrText);
    this.logger.log(`版本比较完成，差异数: ${changes.length}`);

    return {
      changes,
      oldText: v1.ocrText,
      newText: v2.ocrText,
    };
  }

  private generateMockOcrText(document: Document): string {
    const randomIndex = Math.floor(Math.random() * this.mockOcrTexts.length);
    let text = this.mockOcrTexts[randomIndex];
    
    const modifier = Math.random();
    if (modifier < 0.3 && document.ocrStatus === 'completed') {
      text = text + '\n\n【补充说明】本文档经重新扫描，识别精度有所提升。';
      this.logger.debug(`OCR文本添加补充说明，文档ID: ${document.id}`);
    } else if (modifier < 0.6 && document.ocrStatus === 'completed') {
      text = text.replace('违约金', '违约赔偿金');
      this.logger.debug(`OCR文本修改关键词，文档ID: ${document.id}`);
    }

    return text;
  }

  private generateConfidenceScore(): number {
    return Math.round((85 + Math.random() * 15) * 100) / 100;
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

  async batchProcessOcr(documentIds: number[], userId: number): Promise<{ success: number; failed: number; results: OcrProcessResult[] }> {
    this.logger.debug(`批量OCR处理开始，文档数量: ${documentIds.length}，用户ID: ${userId}`);

    const results: OcrProcessResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const documentId of documentIds) {
      try {
        const result = await this.processOcr(documentId, userId);
        results.push(result);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        results.push({ success: false, message: error.message });
        this.logger.error(`批量OCR处理文档失败，文档ID: ${documentId}，错误: ${error.message}`);
      }
    }

    this.logger.log(`批量OCR处理完成，成功: ${successCount}，失败: ${failedCount}`);
    return { success: successCount, failed: failedCount, results };
  }
}
