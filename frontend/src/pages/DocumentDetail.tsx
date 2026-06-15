import React, { useState } from 'react';
import { Typography, Descriptions, Button, Space, Card, Tabs, Table, Tag, Row, Col } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, DownloadOutlined, EditOutlined, BookOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { OcrVersion, DesensitizedVersion, Annotation } from '../services/types';

const { Title } = Typography;

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const documentInfo = {
    id: Number(id),
    documentName: '买卖合同.pdf',
    documentType: 'PDF',
    fileSize: 2048000,
    pageNumber: 12,
    scanDate: '2024-01-15',
    ocrStatus: 'completed',
    version: 1,
    caseNumber: '(2024)仲字第001号',
    caseTitle: '某科技公司合同纠纷案',
    volumeName: '证据卷一',
    createdAt: '2024-01-15T10:00:00Z',
  };

  const ocrVersions: OcrVersion[] = [
    {
      id: 1,
      documentId: Number(id),
      versionNumber: 1,
      ocrText: '买卖合同\n\n甲方：某科技有限公司\n乙方：某贸易有限公司\n\n鉴于...',
      ocrEngine: 'tesseract',
      confidenceScore: 95.5,
      isIncremental: false,
      processedAt: '2024-01-15T12:00:00Z',
      createdAt: '2024-01-15T12:00:00Z',
    },
    {
      id: 2,
      documentId: Number(id),
      versionNumber: 2,
      ocrText: '买卖合同\n\n甲方：某科技有限公司\n乙方：某贸易有限公司\n\n鉴于...（修正版）',
      ocrEngine: 'tesseract',
      confidenceScore: 97.2,
      isIncremental: true,
      incrementalChanges: '修正了第3页的识别错误',
      processedAt: '2024-01-16T10:00:00Z',
      createdAt: '2024-01-16T10:00:00Z',
    },
  ];

  const desensitizedVersions: DesensitizedVersion[] = [
    {
      id: 1,
      ocrVersionId: 1,
      desensitizedText: '买卖合同\n\n甲方：***科技有限公司\n乙方：***贸易有限公司\n\n鉴于...',
      desensitizationRules: { name: true, phone: true, idCard: true, email: true },
      desensitizedCount: 15,
      createdAt: '2024-01-17T10:00:00Z',
    },
  ];

  const annotations: Annotation[] = [
    {
      id: 1,
      documentId: Number(id),
      ocrVersionId: 1,
      annotatorId: 1,
      annotationType: 'highlight',
      content: '此条款为关键条款，需要重点关注',
      createdAt: '2024-01-18T10:00:00Z',
      updatedAt: '2024-01-18T10:00:00Z',
      version: 1,
    },
    {
      id: 2,
      documentId: Number(id),
      ocrVersionId: 1,
      annotatorId: 2,
      annotationType: 'comment',
      content: '此处金额需要核对原始凭证',
      createdAt: '2024-01-18T11:00:00Z',
      updatedAt: '2024-01-18T11:00:00Z',
      version: 1,
    },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const ocrColumns = [
    {
      title: '版本号',
      dataIndex: 'versionNumber',
      key: 'versionNumber',
      width: 100,
    },
    {
      title: 'OCR引擎',
      dataIndex: 'ocrEngine',
      key: 'ocrEngine',
      width: 120,
    },
    {
      title: '置信度',
      dataIndex: 'confidenceScore',
      key: 'confidenceScore',
      width: 100,
      render: (score: number) => `${score}%`,
    },
    {
      title: '增量更新',
      dataIndex: 'isIncremental',
      key: 'isIncremental',
      width: 100,
      render: (value: boolean) => (value ? '是' : '否'),
    },
    {
      title: '处理时间',
      dataIndex: 'processedAt',
      key: 'processedAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: OcrVersion) => (
        <Space>
          <Button type="link" size="small">查看</Button>
          <Button type="link" size="small">下载</Button>
        </Space>
      ),
    },
  ];

  const desensitizationColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '对应OCR版本',
      dataIndex: 'ocrVersionId',
      key: 'ocrVersionId',
      width: 120,
    },
    {
      title: '脱敏数量',
      dataIndex: 'desensitizedCount',
      key: 'desensitizedCount',
      width: 100,
    },
    {
      title: '脱敏规则',
      dataIndex: 'desensitizationRules',
      key: 'desensitizationRules',
      render: (rules: Record<string, boolean>) => (
        <Space wrap>
          {Object.entries(rules).map(([key, value]) => (
            value && <Tag key={key} color="blue">{key}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: DesensitizedVersion) => (
        <Space>
          <Button type="link" size="small">查看</Button>
          <Button type="link" size="small">下载</Button>
        </Space>
      ),
    },
  ];

  const annotationColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'annotationType',
      key: 'annotationType',
      width: 100,
      render: (type: string) => {
        const map: Record<string, string> = {
          highlight: '高亮',
          comment: '评论',
          bookmark: '书签',
        };
        return map[type] || type;
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: () => (
        <Space>
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'info',
      label: '基本信息',
      children: (
        <Card title="文件信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="文件名称">{documentInfo.documentName}</Descriptions.Item>
            <Descriptions.Item label="文件类型">{documentInfo.documentType}</Descriptions.Item>
            <Descriptions.Item label="文件大小">{formatFileSize(documentInfo.fileSize)}</Descriptions.Item>
            <Descriptions.Item label="页数">{documentInfo.pageNumber}</Descriptions.Item>
            <Descriptions.Item label="扫描日期">{documentInfo.scanDate}</Descriptions.Item>
            <Descriptions.Item label="OCR状态">
              <Tag color={documentInfo.ocrStatus === 'completed' ? 'success' : 'processing'}>
                {documentInfo.ocrStatus === 'completed' ? '已完成' : '处理中'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所属案件">{documentInfo.caseNumber}</Descriptions.Item>
            <Descriptions.Item label="所属卷册">{documentInfo.volumeName}</Descriptions.Item>
            <Descriptions.Item label="版本号">{documentInfo.version}</Descriptions.Item>
            <Descriptions.Item label="上传时间">
              {new Date(documentInfo.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'preview',
      label: '文件预览',
      children: (
        <Card title="文件预览">
          <div style={{ height: 600, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#999' }}>
              <EyeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>文件预览区域（PDF渲染器）</p>
            </div>
          </div>
        </Card>
      ),
    },
    {
      key: 'ocr',
      label: 'OCR版本',
      children: (
        <Card
          title="OCR版本历史"
          extra={<Button type="primary" size="small">重新OCR</Button>}
        >
          <Table
            columns={ocrColumns}
            dataSource={ocrVersions}
            rowKey="id"
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <Card title="OCR文本内容" size="small">
                  <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
                    {record.ocrText}
                  </pre>
                </Card>
              ),
            }}
          />
        </Card>
      ),
    },
    {
      key: 'desensitization',
      label: '脱敏版本',
      children: (
        <Card
          title="脱敏版本历史"
          extra={<Button type="primary" size="small" icon={<SecurityScanOutlined />}>新建脱敏</Button>}
        >
          <Table
            columns={desensitizationColumns}
            dataSource={desensitizedVersions}
            rowKey="id"
            pagination={false}
            expandable={{
              expandedRowRender: (record) => (
                <Card title="脱敏后文本" size="small">
                  <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
                    {record.desensitizedText}
                  </pre>
                </Card>
              ),
            }}
          />
        </Card>
      ),
    },
    {
      key: 'annotations',
      label: '标注管理',
      children: (
        <Card
          title="标注列表"
          extra={<Button type="primary" size="small">新增标注</Button>}
        >
          <Table
            columns={annotationColumns}
            dataSource={annotations}
            rowKey="id"
            pagination={{
              total: annotations.length,
              pageSize: 10,
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          返回
        </Button>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {documentInfo.documentName}
            </Title>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              {documentInfo.caseNumber} - {documentInfo.volumeName}
            </p>
          </Col>
          <Col>
            <Space>
              <Button icon={<EyeOutlined />}>预览</Button>
              <Button icon={<DownloadOutlined />}>下载</Button>
              <Button icon={<BookOutlined />} onClick={() => navigate('/borrow/apply')}>
                申请借阅
              </Button>
              <Button icon={<EditOutlined />} type="primary">
                编辑
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
};

export default DocumentDetail;
