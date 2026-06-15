import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('全文搜索')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: '关键词全文搜索' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: true })
  @ApiQuery({ name: 'page', description: '页码', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false, type: Number })
  @ApiQuery({ name: 'caseType', description: '案件类型筛选', required: false })
  @ApiQuery({ name: 'startDate', description: '开始日期 (YYYY-MM-DD)', required: false })
  @ApiQuery({ name: 'endDate', description: '结束日期 (YYYY-MM-DD)', required: false })
  async search(
    @Query('keyword') keyword: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('caseType') caseType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.debug(`搜索请求，关键词: "${keyword}"`);

    const result = await this.searchService.search(
      keyword,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      {
        caseType,
        startDate,
        endDate,
      },
    );

    return {
      code: 200,
      message: 'success',
      data: {
        groups: result.groups,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('case-types')
  @ApiOperation({ summary: '获取案件类型列表' })
  async getCaseTypes() {
    this.logger.debug('获取案件类型列表');
    const types = await this.searchService.getCaseTypes();
    return {
      code: 200,
      message: 'success',
      data: types,
    };
  }

  @Get('case-causes')
  @ApiOperation({ summary: '获取案由列表' })
  async getCaseCauses() {
    this.logger.debug('获取案由列表');
    const causes = await this.searchService.getCaseCauses();
    return {
      code: 200,
      message: 'success',
      data: causes,
    };
  }
}
