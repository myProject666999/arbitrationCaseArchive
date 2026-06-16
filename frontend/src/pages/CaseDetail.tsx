import React, { useState, useEffect } from 'react';
import { Typography, Descriptions, Button, Space, Card, Table, Tag, Modal, Form, Input, DatePicker, message, InputNumber, Popconfirm, Upload } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import type { Case, CaseFormData, Volume, Document } from '../services/types';
import { caseApi, volumeApi, documentApi } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseForm] = Form.useForm();
  const [volumeForm] = Form.useForm();

  const [caseInfo, setCaseInfo] = useState<Case | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  const [editCaseModalVisible, setEditCaseModalVisible] = useState(false);
  const [addVolumeModalVisible, setAddVolumeModalVisible] = useState(false);
  const [editVolumeModalVisible, setEditVolumeModalVisible] = useState(false);
  const [editingVolume, setEditingVolume] = useState<Volume | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const caseData = await caseApi.getCaseDetail(Number(id));
      setCaseInfo(caseData);
      const volumeData = await volumeApi.getVolumesByCase(Number(id));
      setVolumes(volumeData);
      const allDocs: Document[] = [];
      for (const vol of volumeData) {
        try {
          const docs = await documentApi.getDocumentsByVolume(vol.id);
          allDocs.push(...docs);
        } catch {}
      }
      setDocuments(allDocs);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取案件详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditCase = () => {
    if (!caseInfo) return;
    caseForm.setFieldsValue({
      caseNumber: caseInfo.caseNumber,
      caseTitle: caseInfo.caseTitle,
      caseType: caseInfo.caseType,
      caseCause: caseInfo.caseCause,
      applicant: caseInfo.applicant,
      respondent: caseInfo.respondent,
      caseDate: caseInfo.caseDate ? dayjs(caseInfo.caseDate) : undefined,
      summary: caseInfo.summary,
      isConfidential: caseInfo.isConfidential,
    });
    setEditCaseModalVisible(true);
  };

  const handleEditCaseSubmit = async () => {
    try {
      const values = await caseForm.validateFields();
      const formData: CaseFormData = {
        ...values,
        caseDate: values.caseDate ? values.caseDate.format('YYYY-MM-DD') : undefined,
      };
      await caseApi.updateCase(Number(id), formData);
      message.success('案件信息更新成功');
      setEditCaseModalVisible(false);
      fetchData();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '更新失败');
      }
    }
  };

  const handleAddVolume = () => {
    setEditingVolume(null);
    volumeForm.resetFields();
    volumeForm.setFieldsValue({
      volumeNumber: volumes.length + 1,
    });
    setAddVolumeModalVisible(true);
  };

  const handleAddVolumeSubmit = async () => {
    try {
      const values = await volumeForm.validateFields();
      await volumeApi.createVolume({
        caseId: Number(id),
        ...values,
      });
      message.success('卷册创建成功');
      setAddVolumeModalVisible(false);
      fetchData();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '创建失败');
      }
    }
  };

  const handleEditVolume = (volume: Volume) => {
    setEditingVolume(volume);
    volumeForm.setFieldsValue({
      volumeNumber: volume.volumeNumber,
      volumeName: volume.volumeName,
      description: volume.description,
    });
    setEditVolumeModalVisible(true);
  };

  const handleEditVolumeSubmit = async () => {
    if (!editingVolume) return;
    try {
      const values = await volumeForm.validateFields();
      await volumeApi.updateVolume(editingVolume.id, values);
      message.success('卷册更新成功');
      setEditVolumeModalVisible(false);
      fetchData();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '更新失败');
      }
    }
  };

  const handleDeleteVolume = async (volumeId: number) => {
    try {
      await volumeApi.deleteVolume(volumeId);
      message.success('卷册删除成功');
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await documentApi.deleteDocument(docId);
      message.success('文件删除成功');
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleUploadDocument = (volumeId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.tif,.tiff';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await documentApi.uploadDocument(file, volumeId);
        message.success('文件上传成功');
        fetchData();
      } catch (error) {
        message.error(error instanceof Error ? error.message : '上传失败');
      }
    };
    input.click();
  };

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
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Volume) => (
        <Space>
          <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => handleUploadDocument(record.id)}>
            上传文件
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditVolume(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除此卷册？" onConfirm={() => handleDeleteVolume(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
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
      width: 150,
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
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Document) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/documents/${record.id}`)}>
            查看
          </Button>
          <Popconfirm title="确定删除此文件？" onConfirm={() => handleDeleteDocument(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!caseInfo) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

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
            <Button icon={<PlusOutlined />} onClick={handleAddVolume}>新增卷册</Button>
            <Button icon={<EditOutlined />} type="primary" onClick={handleEditCase}>
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
          <Descriptions.Item label="创建时间">{caseInfo.createdAt}</Descriptions.Item>
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

      <Modal
        title="编辑案件"
        open={editCaseModalVisible}
        onOk={handleEditCaseSubmit}
        onCancel={() => setEditCaseModalVisible(false)}
        width={700}
        destroyOnHidden
        okText="保存"
        cancelText="取消"
      >
        <Form form={caseForm} layout="vertical">
          <Form.Item name="caseNumber" label="案件编号" rules={[{ required: true, message: '请输入案件编号' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="caseTitle" label="案件标题" rules={[{ required: true, message: '请输入案件标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="caseType" label="案件类型" rules={[{ required: true, message: '请输入案件类型' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="caseCause" label="案由" rules={[{ required: true, message: '请输入案由' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="applicant" label="申请人">
            <Input />
          </Form.Item>
          <Form.Item name="respondent" label="被申请人">
            <Input />
          </Form.Item>
          <Form.Item name="caseDate" label="立案日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isConfidential" label="是否涉密" valuePropName="checked">
            <Input type="checkbox" />
          </Form.Item>
          <Form.Item name="summary" label="案情摘要">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingVolume ? '编辑卷册' : '新增卷册'}
        open={addVolumeModalVisible || editVolumeModalVisible}
        onOk={editingVolume ? handleEditVolumeSubmit : handleAddVolumeSubmit}
        onCancel={() => {
          setAddVolumeModalVisible(false);
          setEditVolumeModalVisible(false);
          setEditingVolume(null);
        }}
        destroyOnHidden
        okText="保存"
        cancelText="取消"
      >
        <Form form={volumeForm} layout="vertical">
          <Form.Item name="volumeNumber" label="卷册号" rules={[{ required: true, message: '请输入卷册号' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="volumeName" label="卷册名称" rules={[{ required: true, message: '请输入卷册名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CaseDetail;
