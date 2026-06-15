import React, { useState } from 'react';
import { Typography, Table, Button, Space, Tag, Card, Select, Modal, Form, Input, message, Row, Col } from 'antd';
import { TagOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Annotation } from '../services/types';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Annotations: React.FC = () => {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [form] = Form.useForm();

  const annotationTypes = [
    { key: 'highlight', label: '高亮', color: 'yellow' },
    { key: 'comment', label: '评论', color: 'blue' },
    { key: 'bookmark', label: '书签', color: 'green' },
    { key: 'correction', label: '勘误', color: 'red' },
  ];

  const mockAnnotations: Annotation[] = [
    {
      id: 1,
      documentId: 1,
      ocrVersionId: 1,
      annotatorId: 1,
      annotationType: 'highlight',
      content: '此条款为关键条款，需要重点关注',
      createdAt: '2024-01-18T10:00:00Z',
      updatedAt: '2024-01-18T10:00:00Z',
      version: 1,
      document: {
        id: 1,
        volumeId: 1,
        documentName: '买卖合同.pdf',
        ocrStatus: 'completed',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      annotator: {
        id: 1,
        username: 'admin',
        realName: '管理员',
        role: 'admin',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 2,
      documentId: 1,
      ocrVersionId: 1,
      annotatorId: 2,
      annotationType: 'comment',
      content: '此处金额需要核对原始凭证',
      createdAt: '2024-01-18T11:00:00Z',
      updatedAt: '2024-01-18T11:00:00Z',
      version: 1,
      document: {
        id: 1,
        volumeId: 1,
        documentName: '买卖合同.pdf',
        ocrStatus: 'completed',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      annotator: {
        id: 2,
        username: 'user1',
        realName: '张三',
        role: 'user',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 3,
      documentId: 2,
      ocrVersionId: 2,
      annotatorId: 1,
      annotationType: 'bookmark',
      content: '重要付款凭证',
      createdAt: '2024-01-19T09:00:00Z',
      updatedAt: '2024-01-19T09:00:00Z',
      version: 1,
      document: {
        id: 2,
        volumeId: 1,
        documentName: '付款凭证.pdf',
        ocrStatus: 'completed',
        version: 1,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      annotator: {
        id: 1,
        username: 'admin',
        realName: '管理员',
        role: 'admin',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: 4,
      documentId: 3,
      ocrVersionId: 3,
      annotatorId: 3,
      annotationType: 'correction',
      content: '此处OCR识别有误，应为"人民币"而非"人民市"',
      createdAt: '2024-01-19T14:00:00Z',
      updatedAt: '2024-01-19T14:00:00Z',
      version: 1,
      document: {
        id: 3,
        volumeId: 2,
        documentName: '庭审笔录.pdf',
        ocrStatus: 'completed',
        version: 1,
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
      },
      annotator: {
        id: 3,
        username: 'user2',
        realName: '李四',
        role: 'user',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  ];

  const getTypeInfo = (type: string) => {
    const info = annotationTypes.find((t) => t.key === type);
    return info || { label: type, color: 'default' };
  };

  const handleAdd = () => {
    setEditingAnnotation(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (record: Annotation) => {
    setEditingAnnotation(record);
    setModalVisible(true);
    form.setFieldsValue({
      annotationType: record.annotationType,
      content: record.content,
    });
  };

  const handleDelete = (record: Annotation) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除该标注吗？`,
      onOk: () => {
        message.success('删除成功');
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      message.success(editingAnnotation ? '修改成功' : '添加成功');
      setModalVisible(false);
      setEditingAnnotation(null);
    } catch {
      console.log('Validation failed');
    }
  };

  const filteredData = typeFilter
    ? mockAnnotations.filter((item) => item.annotationType === typeFilter)
    : mockAnnotations;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '文件',
      dataIndex: ['document', 'documentName'],
      key: 'documentName',
      render: (text: string, record: Annotation) => (
        <a onClick={() => navigate(`/documents/${record.documentId}`)}>{text}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'annotationType',
      key: 'annotationType',
      width: 100,
      render: (type: string) => {
        const info = getTypeInfo(type);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '标注人',
      dataIndex: ['annotator', 'realName'],
      key: 'annotator',
      width: 100,
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
      width: 150,
      render: (_: unknown, record: Annotation) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <TagOutlined style={{ marginRight: 8 }} />
          标注管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增标注
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="类型筛选"
          style={{ width: 150 }}
          allowClear
          value={typeFilter || undefined}
          onChange={(value) => setTypeFilter(value || '')}
        >
          {annotationTypes.map((type) => (
            <Option key={type.key} value={type.key}>
              <Tag color={type.color}>{type.label}</Tag>
            </Option>
          ))}
        </Select>
      </div>

      <Card title="标注列表">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={editingAnnotation ? '编辑标注' : '新增标注'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingAnnotation(null);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="documentId"
            label="选择文件"
            rules={[{ required: true, message: '请选择文件' }]}
          >
            <Select placeholder="请选择要标注的文件" showSearch>
              {mockAnnotations
                .filter((a, i, arr) => arr.findIndex((x) => x.documentId === a.documentId) === i)
                .map((a) => (
                  <Option key={a.documentId} value={a.documentId}>
                    {a.document?.documentName}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="annotationType"
            label="标注类型"
            rules={[{ required: true, message: '请选择标注类型' }]}
          >
            <Select placeholder="请选择标注类型">
              {annotationTypes.map((type) => (
                <Option key={type.key} value={type.key}>
                  <Tag color={type.color}>{type.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="标注内容"
            rules={[
              { required: true, message: '请输入标注内容' },
              { min: 2, message: '标注内容至少2个字符' },
            ]}
          >
            <TextArea rows={4} placeholder="请输入标注内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Annotations;
