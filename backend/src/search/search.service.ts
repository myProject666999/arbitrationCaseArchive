import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Case } from '../common/entities/case.entity';
import { OcrVersion } from '../common/entities/ocr-version.entity';
import { DesensitizedVersion } from '../common/entities/desensitized-version.entity';
import { Document } from '../common/entities/document.entity';
import { Volume } from '../common/entities/volume.entity';

export interface SearchResult {
  id: number;
  caseNumber: string;
  caseTitle: string;
  caseType: string;
  caseCause: string;
  caseDate: Date;
  applicant: string;
  respondent: string;
  summary: string;
  relevance: number;
  matchedFields: string[];
  matchedText?: string;
}

export interface SearchGroup {
  caseCause: string;
  count: number;
  results: SearchResult[];
}

export interface SearchResponse {
  groups: SearchGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchFilter {
  caseType?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(OcrVersion)
    private ocrVersionRepository: Repository<OcrVersion>,
    @InjectRepository(DesensitizedVersion)
    private desensitizedVersionRepository: Repository<DesensitizedVersion>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Volume)
    private volumeRepository: Repository<Volume>,
    private dataSource: DataSource,
  ) {}

  async search(
    keyword: string,
    page: number = 1,
    pageSize: number = 10,
    filter: SearchFilter = {},
  ): Promise<SearchResponse> {
    this.logger.debug(`执行全文搜索，关键词: "${keyword}"，页码: ${page}，每页数量: ${pageSize}`);

    if (!keyword || keyword.trim().length === 0) {
      this.logger.warn('搜索关键词为空');
      throw new BadRequestException('搜索关键词不能为空');
    }

    if (page < 1) {
      page = 1;
    }
    if (pageSize < 1 || pageSize > 100) {
      pageSize = 10;
    }

    const trimmedKeyword = keyword.trim();
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      const caseResults = await this.searchInCases(trimmedKeyword, filter);
      this.logger.debug(`案件表搜索结果: ${caseResults.length}条`);

      const ocrResults = await this.searchInOcrVersions(trimmedKeyword, filter);
      this.logger.debug(`OCR文本表搜索结果: ${ocrResults.length}条`);

      const desensitizedResults = await this.searchInDesensitizedVersions(trimmedKeyword, filter);
      this.logger.debug(`脱敏文本表搜索结果: ${desensitizedResults.length}条`);

      const mergedResults = this.mergeSearchResults(caseResults, ocrResults, desensitizedResults);
      this.logger.debug(`合并后搜索结果: ${mergedResults.length}条`);

      const sortedResults = mergedResults.sort((a, b) => b.relevance - a.relevance);

      const total = sortedResults.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = sortedResults.slice(startIndex, endIndex);

      const groups = this.groupByCaseCause(paginatedResults);
      this.logger.log(`搜索完成，关键词: "${keyword}"，总结果数: ${total}，分组数: ${groups.length}`);

      return {
        groups,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`搜索失败，关键词: "${keyword}"，错误: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async searchInCases(keyword: string, filter: SearchFilter): Promise<SearchResult[]> {
    this.logger.debug(`在案件表中搜索，关键词: "${keyword}"`);

    let query = this.caseRepository
      .createQueryBuilder('c')
      .select([
        'c.id',
        'c.caseNumber',
        'c.caseTitle',
        'c.caseType',
        'c.caseCause',
        'c.caseDate',
        'c.applicant',
        'c.respondent',
        'c.summary',
      ])
      .addSelect(
        `MATCH(c.case_number, c.case_title, c.case_cause, c.applicant, c.respondent, c.summary) AGAINST (:keyword IN BOOLEAN MODE)`,
        'relevance',
      )
      .where(
        `MATCH(c.case_number, c.case_title, c.case_cause, c.applicant, c.respondent, c.summary) AGAINST (:keyword IN BOOLEAN MODE) > 0`,
        { keyword: this.formatBooleanKeyword(keyword) },
      );

    query = this.applyFilter(query, filter);

    const results = await query
      .orderBy('relevance', 'DESC')
      .getRawMany();

    return results.map((row) => ({
      id: row.c_id,
      caseNumber: row.c_caseNumber || row.c_case_number,
      caseTitle: row.c_caseTitle || row.c_case_title,
      caseType: row.c_caseType || row.c_case_type,
      caseCause: row.c_caseCause || row.c_case_cause,
      caseDate: row.c_caseDate || row.c_case_date,
      applicant: row.c_applicant,
      respondent: row.c_respondent,
      summary: row.c_summary,
      relevance: parseFloat(row.relevance) || 1,
      matchedFields: ['caseInfo'],
      matchedText: this.extractMatchedText(row.c_summary || row.c_caseTitle || row.c_case_title, keyword),
    }));
  }

  private async searchInOcrVersions(keyword: string, filter: SearchFilter): Promise<SearchResult[]> {
    this.logger.debug(`在OCR文本表中搜索，关键词: "${keyword}"`);

    let query = this.ocrVersionRepository
      .createQueryBuilder('ov')
      .innerJoin('ov.document', 'd')
      .innerJoin('d.volume', 'v')
      .innerJoin('v.caseItem', 'c')
      .select([
        'c.id as caseId',
        'c.caseNumber',
        'c.caseTitle',
        'c.caseType',
        'c.caseCause',
        'c.caseDate',
        'c.applicant',
        'c.respondent',
        'c.summary',
        'ov.ocrText',
        'd.id as documentId',
        'd.documentName',
      ])
      .addSelect(
        `MATCH(ov.ocr_text) AGAINST (:keyword IN BOOLEAN MODE)`,
        'relevance',
      )
      .where(
        `MATCH(ov.ocr_text) AGAINST (:keyword IN BOOLEAN MODE) > 0`,
        { keyword: this.formatBooleanKeyword(keyword) },
      )
      .andWhere('ov.id = d.latestOcrVersionId');

    query = this.applyFilter(query, filter, 'c');

    const results = await query
      .orderBy('relevance', 'DESC')
      .getRawMany();

    const uniqueCases = new Map<number, SearchResult>();

    for (const row of results) {
      const caseId = row.caseId;
      const relevance = parseFloat(row.relevance) || 1;

      if (!uniqueCases.has(caseId) || relevance > uniqueCases.get(caseId).relevance) {
        uniqueCases.set(caseId, {
          id: caseId,
          caseNumber: row.caseNumber || row.c_case_number,
          caseTitle: row.caseTitle || row.c_case_title,
          caseType: row.caseType || row.c_case_type,
          caseCause: row.caseCause || row.c_case_cause,
          caseDate: row.caseDate || row.c_case_date,
          applicant: row.applicant || row.c_applicant,
          respondent: row.respondent || row.c_respondent,
          summary: row.summary || row.c_summary,
          relevance,
          matchedFields: ['ocrText'],
          matchedText: this.extractMatchedText(row.ocrText || row.ov_ocr_text, keyword),
        });
      }
    }

    return Array.from(uniqueCases.values());
  }

  private async searchInDesensitizedVersions(keyword: string, filter: SearchFilter): Promise<SearchResult[]> {
    this.logger.debug(`在脱敏文本表中搜索，关键词: "${keyword}"`);

    let query = this.desensitizedVersionRepository
      .createQueryBuilder('dv')
      .innerJoin('dv.ocrVersion', 'ov')
      .innerJoin('ov.document', 'd')
      .innerJoin('d.volume', 'v')
      .innerJoin('v.caseItem', 'c')
      .select([
        'c.id as caseId',
        'c.caseNumber',
        'c.caseTitle',
        'c.caseType',
        'c.caseCause',
        'c.caseDate',
        'c.applicant',
        'c.respondent',
        'c.summary',
        'dv.desensitizedText',
        'd.id as documentId',
        'd.documentName',
      ])
      .addSelect(
        `MATCH(dv.desensitized_text) AGAINST (:keyword IN BOOLEAN MODE)`,
        'relevance',
      )
      .where(
        `MATCH(dv.desensitized_text) AGAINST (:keyword IN BOOLEAN MODE) > 0`,
        { keyword: this.formatBooleanKeyword(keyword) },
      );

    query = this.applyFilter(query, filter, 'c');

    const results = await query
      .orderBy('relevance', 'DESC')
      .getRawMany();

    const uniqueCases = new Map<number, SearchResult>();

    for (const row of results) {
      const caseId = row.caseId;
      const relevance = parseFloat(row.relevance) || 1;

      if (!uniqueCases.has(caseId) || relevance > uniqueCases.get(caseId).relevance) {
        uniqueCases.set(caseId, {
          id: caseId,
          caseNumber: row.caseNumber || row.c_case_number,
          caseTitle: row.caseTitle || row.c_case_title,
          caseType: row.caseType || row.c_case_type,
          caseCause: row.caseCause || row.c_case_cause,
          caseDate: row.caseDate || row.c_case_date,
          applicant: row.applicant || row.c_applicant,
          respondent: row.respondent || row.c_respondent,
          summary: row.summary || row.c_summary,
          relevance,
          matchedFields: ['desensitizedText'],
          matchedText: this.extractMatchedText(row.desensitizedText || row.dv_desensitized_text, keyword),
        });
      }
    }

    return Array.from(uniqueCases.values());
  }

  private mergeSearchResults(
    caseResults: SearchResult[],
    ocrResults: SearchResult[],
    desensitizedResults: SearchResult[],
  ): SearchResult[] {
    const mergedMap = new Map<number, SearchResult>();

    const addResult = (result: SearchResult) => {
      const existing = mergedMap.get(result.id);
      if (!existing) {
        mergedMap.set(result.id, { ...result });
      } else {
        existing.relevance = Math.max(existing.relevance, result.relevance);
        existing.matchedFields = [...new Set([...existing.matchedFields, ...result.matchedFields])];
        if (!existing.matchedText && result.matchedText) {
          existing.matchedText = result.matchedText;
        }
      }
    };

    caseResults.forEach(addResult);
    ocrResults.forEach(addResult);
    desensitizedResults.forEach(addResult);

    return Array.from(mergedMap.values());
  }

  private groupByCaseCause(results: SearchResult[]): SearchGroup[] {
    const groupsMap = new Map<string, SearchResult[]>();

    for (const result of results) {
      const cause = result.caseCause || '其他';
      if (!groupsMap.has(cause)) {
        groupsMap.set(cause, []);
      }
      groupsMap.get(cause).push(result);
    }

    const groups: SearchGroup[] = [];
    for (const [caseCause, caseResults] of groupsMap.entries()) {
      groups.push({
        caseCause,
        count: caseResults.length,
        results: caseResults,
      });
    }

    return groups.sort((a, b) => b.count - a.count);
  }

  private formatBooleanKeyword(keyword: string): string {
    const words = keyword.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return keyword;

    return words.map((word) => `+${word}*`).join(' ');
  }

  private extractMatchedText(text: string, keyword: string, contextLength: number = 100): string | undefined {
    if (!text) return undefined;

    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerText.indexOf(lowerKeyword);

    if (index === -1) {
      if (text.length > contextLength * 2) {
        return text.substring(0, contextLength * 2) + '...';
      }
      return text;
    }

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + keyword.length + contextLength);
    let snippet = text.substring(start, end);

    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < text.length) {
      snippet = snippet + '...';
    }

    return snippet;
  }

  private applyFilter(query: any, filter: SearchFilter, caseAlias: string = 'c'): any {
    if (filter.caseType) {
      query = query.andWhere(`${caseAlias}.case_type = :caseType`, { caseType: filter.caseType });
      this.logger.debug(`应用案件类型筛选: ${filter.caseType}`);
    }

    if (filter.startDate) {
      query = query.andWhere(`${caseAlias}.case_date >= :startDate`, { startDate: filter.startDate });
      this.logger.debug(`应用开始日期筛选: ${filter.startDate}`);
    }

    if (filter.endDate) {
      query = query.andWhere(`${caseAlias}.case_date <= :endDate`, { endDate: filter.endDate });
      this.logger.debug(`应用结束日期筛选: ${filter.endDate}`);
    }

    return query;
  }

  async getCaseTypes(): Promise<{ type: string; count: number }[]> {
    this.logger.debug('获取案件类型列表');

    const results = await this.caseRepository
      .createQueryBuilder('c')
      .select('c.caseType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.caseType')
      .getRawMany();

    return results.map((row) => ({
      type: row.type || row.caseType || row.c_case_type,
      count: parseInt(row.count, 10),
    }));
  }

  async getCaseCauses(): Promise<{ cause: string; count: number }[]> {
    this.logger.debug('获取案由列表');

    const results = await this.caseRepository
      .createQueryBuilder('c')
      .select('c.caseCause', 'cause')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.caseCause')
      .getRawMany();

    return results.map((row) => ({
      cause: row.cause || row.caseCause || row.c_case_cause,
      count: parseInt(row.count, 10),
    }));
  }
}
