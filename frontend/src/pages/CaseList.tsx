import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Input, Select, Modal, Form, DatePicker, message, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Case, CaseFormData } from '../services/types';
import { caseApi } from '../services/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const CaseList: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [data, setData] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await caseApi.getCaseList(page, pageSize, keyword || undefined);
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取案件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
    fetchData();
  };

  const handleAdd = () => {
    setEditingCase(null);
    form.resetFields();
    form.setFieldsValue({
      caseType: '商事仲裁',
      isConfidential: false,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Case) => {
    setEditingCase(record);
    form.setFieldsValue({
      caseNumber: record.caseNumber,
      caseTitle: record.caseTitle,
      caseType: record.caseType,
      caseCause: record.caseCause,
      applicant: record.applicant,
      respondent: record.respondent,
      caseDate: record.caseDate ? dayjs(record.caseDate) : undefined,
      summary: record.summary,
      isConfidential: record.isConfidential,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await caseApi.deleteCase(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData: CaseFormData = {
        ...values,
        caseDate: values.caseDate ? values.caseDate.format('YYYY-MM-DD') : undefined,
      };

      if (editingCase) {
        await caseApi.updateCase(editingCase.id, formData);
        message.success('更新成功');
      } else {
        await caseApi.createCase(formData);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '操作失败');
      }
    }
  };

  const columns = [
    {
      title: '案件编号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 180,
      render: (text: string, record: Case) => (
        <a onClick={() => navigate(`/cases/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '案件标题',
      dataIndex: 'caseTitle',
      key: 'caseTitle',
      ellipsis: true,
    },
    {
      title: '案件类型',
      dataIndex: 'caseType',
      key: 'caseType',
      width: 120,
    },
    {
      title: '案由',
      dataIndex: 'caseCause',
      key: 'caseCause',
      width: 150,
      ellipsis: true,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 150,
      ellipsis: true,
    },
    {
      title: '被申请人',
      dataIndex: 'respondent',
      key: 'respondent',
      width: 150,
      ellipsis: true,
    },
    {
      title: '立案日期',
      dataIndex: 'caseDate',
      key: 'caseDate',
      width: 120,
    },
    {
      title: '涉密',
      dataIndex: 'isConfidential',
      key: 'isConfidential',
      width: 80,
      render: (value: boolean) => value ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Case) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/cases/${record.id}`)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: '确认删除',
              content: `确定要删除案件「${record.caseTitle}」吗？`,
              onOk: () => handleDelete(record.id),
            });
          }}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>案件列表</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增案件
        </Button>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <Search
          placeholder="搜索案件编号、标题..."
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 300 }}
          onSearch={handleSearch}
        />
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title={editingCase ? '编辑案件' : '新增案件'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnHidden
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="caseNumber"
            label="案件编号"
            rules={[{ required: true, message: '请输入案件编号' }]}
          >
            <Input placeholder="如：(2024)仲字第001号" />
          </Form.Item>
          <Form.Item
            name="caseTitle"
            label="案件标题"
            rules={[{ required: true, message: '请输入案件标题' }]}
          >
            <Input placeholder="请输入案件标题" />
          </Form.Item>
          <Space style={{ width: '100' }} size="large">
            <Form.Item
              name="caseType"
              label="案件类型"
              rules={[{ required: true, message: '请选择案件类型' }]}
              style={{ width: 300 }}
            >
              <Select placeholder="请选择案件类型">
                <Option value="商事仲裁">商事仲裁</Option>
                <Option value="劳动仲裁">劳动仲裁</Option>
                <Option value="海事仲裁">海事仲裁</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="isConfidential"
              label="是否涉密"
              rules={[{ required: true, message: '请选择' }]}
              style={{ width: 300 }}
            >
              <Select placeholder="请选择">
                <Option value={false}>否</Option>
                <Option value={true}>是</Option>
              </Select>
            </Form.Item>
          </Space>
          <Form.Item
            name="caseCause"
            label="案由"
            rules={[{ required: true, message: '请输入案由' }]}
          >
            <Input placeholder="请输入案由" />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large">
            <Form.Item name="applicant" label="申请人" style={{ width: 300 }}>
              <Input placeholder="请输入申请人" />
            </Form.Item>
            <Form.Item name="respondent" label="被申请人" style={{ width: 300 }}>
              <Input placeholder="请输入被申请人" />
            </Form.Item>
          </Space>
          <Form.Item name="caseDate" label="立案日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="summary" label="案情摘要">
            <Input.TextArea rows={4} placeholder="请输入案情摘要" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CaseList;
