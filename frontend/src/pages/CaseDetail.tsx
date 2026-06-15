import React from 'react';
import { Typography, Descriptions, Button, Space, Card, Table, Tag } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { Volume, Document } from '../services/types';

const { Title } = Typography;

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const caseInfo = {
    caseNumber: '(2024)仲字第001号',
    caseTitle: '某科技公司合同纠纷案',
    caseType: '合同纠纷',
    caseCause: '买卖合同纠纷',
    applicant: '某科技有限公司',
    respondent: '某贸易有限公司',
    caseDate: '2024-01-15',
    summary: '本案系申请人与被申请人之间因买卖合同履行产生的争议。申请人诉称被申请人未按合同约定支付货款，请求裁决被申请人支付货款及违约金。',
    isConfidential: false,
    createdAt: '2024-01-15T10:00:00Z',
  };

  const volumes: Volume[] = [
    {
      id: 1,
      caseId: Number(id),
      volumeNumber: 1,
      volumeName: '证据卷一',
      description: '包含合同、付款凭证等证据材料',
      pageCount: 156,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      caseId: Number(id),
      volumeNumber: 2,
      volumeName: '证据卷二',
      description: '包含庭审笔录、代理意见等材料',
      pageCount: 89,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ];

  const documents: Document[] = [
    {
      id: 1,
      volumeId: 1,
      documentName: '买卖合同.pdf',
      documentType: 'PDF',
      fileSize: 2048000,
      pageNumber: 12,
      scanDate: '2024-01-15',
      ocrStatus: 'completed',
      version: 1,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      volumeId: 1,
      documentName: '付款凭证.pdf',
      documentType: 'PDF',
      fileSize: 1024000,
      pageNumber: 8,
      scanDate: '2024-01-15',
      ocrStatus: 'completed',
      version: 1,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 3,
      volumeId: 2,
      documentName: '庭审笔录.pdf',
      documentType: 'PDF',
      fileSize: 512000,
      pageNumber: 45,
      scanDate: '2024-01-20',
      ocrStatus: 'processing',
      version: 1,
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
  ];

  const volumeColumns = [
    {
      title: '卷册号',
      dataIndex: 'volumeNumber',
      key: 'volumeNumber',
      width: 100,
    },
    {
      title: '卷册名称',
      dataIndex: 'volumeName',
      key: 'volumeName',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '页数',
      dataIndex: 'pageCount',
      key: 'pageCount',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
  ];

  const documentColumns = [
    {
      title: '文件名称',
      dataIndex: 'documentName',
      key: 'documentName',
      render: (text: string, record: Document) => (
        <a onClick={() => navigate(`/documents/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '所属卷册',
      dataIndex: 'volumeId',
      key: 'volumeId',
      render: (volumeId: number) => {
        const vol = volumes.find((v) => v.id === volumeId);
        return vol ? vol.volumeName : '-';
      },
    },
    {
      title: '类型',
      dataIndex: 'documentType',
      key: 'documentType',
      width: 100,
    },
    {
      title: '页数',
      dataIndex: 'pageNumber',
      key: 'pageNumber',
      width: 80,
    },
    {
      title: 'OCR状态',
      dataIndex: 'ocrStatus',
      key: 'ocrStatus',
      width: 120,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'default',
          processing: 'processing',
          completed: 'success',
          failed: 'error',
        };
        const textMap: Record<string, string> = {
          pending: '待处理',
          processing: '处理中',
          completed: '已完成',
          failed: '失败',
        };
        return <Tag color={colorMap[status] as any}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '扫描日期',
      dataIndex: 'scanDate',
      key: 'scanDate',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Document) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/documents/${record.id}`)}>
            查看
          </Button>
          <Button type="link">借阅</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')} style={{ marginBottom: 16 }}>
          返回列表
        </Button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            {caseInfo.caseNumber} - {caseInfo.caseTitle}
          </Title>
          <Space>
            <Button icon={<PlusOutlined />}>新增卷册</Button>
            <Button icon={<EditOutlined />} type="primary">
              编辑
            </Button>
          </Space>
        </div>
      </div>

      <Card title="案件信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="案件编号">{caseInfo.caseNumber}</Descriptions.Item>
          <Descriptions.Item label="案件类型">{caseInfo.caseType}</Descriptions.Item>
          <Descriptions.Item label="案件案由">{caseInfo.caseCause}</Descriptions.Item>
          <Descriptions.Item label="立案日期">{caseInfo.caseDate}</Descriptions.Item>
          <Descriptions.Item label="申请人">{caseInfo.applicant}</Descriptions.Item>
          <Descriptions.Item label="被申请人">{caseInfo.respondent}</Descriptions.Item>
          <Descriptions.Item label="是否保密">
            <Tag color={caseInfo.isConfidential ? 'red' : 'green'}>
              {caseInfo.isConfidential ? '是' : '否'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(caseInfo.createdAt).toLocaleString('zh-CN')}
          </Descriptions.Item>
          <Descriptions.Item label="案情摘要" span={2}>
            {caseInfo.summary}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="卷册列表" style={{ marginBottom: 24 }}>
        <Table
          columns={volumeColumns}
          dataSource={volumes}
          rowKey="id"
          pagination={false}
          expandable={{
            expandedRowRender: (record) => {
              const volDocs = documents.filter((d) => d.volumeId === record.id);
              return (
                <Table
                  columns={documentColumns.filter((c) => c.key !== 'volumeId')}
                  dataSource={volDocs}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              );
            },
          }}
        />
      </Card>

      <Card title="所有文件">
        <Table
          columns={documentColumns}
          dataSource={documents}
          rowKey="id"
          pagination={{
            total: documents.length,
            pageSize: 10,
          }}
        />
      </Card>
    </div>
  );
};

export default CaseDetail;
