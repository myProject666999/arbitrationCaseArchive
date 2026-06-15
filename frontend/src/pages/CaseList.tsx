import React from 'react';
import { Typography, Table, Button, Space, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Case } from '../services/types';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const CaseList: React.FC = () => {
  const navigate = useNavigate();

  const mockData: Case[] = [
    {
      id: 1,
      caseNumber: '(2024)仲字第001号',
      caseTitle: '某科技公司合同纠纷案',
      caseType: '合同纠纷',
      caseCause: '买卖合同纠纷',
      applicant: '某科技有限公司',
      respondent: '某贸易有限公司',
      caseDate: '2024-01-15',
      isConfidential: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 2,
      caseNumber: '(2024)仲字第002号',
      caseTitle: '某建筑工程施工合同纠纷案',
      caseType: '建筑工程',
      caseCause: '施工合同纠纷',
      applicant: '某建筑集团有限公司',
      respondent: '某房地产开发有限公司',
      caseDate: '2024-02-20',
      isConfidential: true,
      createdAt: '2024-02-20T14:30:00Z',
      updatedAt: '2024-02-20T14:30:00Z',
    },
    {
      id: 3,
      caseNumber: '(2024)仲字第003号',
      caseTitle: '某股权转让纠纷案',
      caseType: '股权纠纷',
      caseCause: '股权转让协议纠纷',
      applicant: '张某',
      respondent: '李某',
      caseDate: '2024-03-10',
      isConfidential: false,
      createdAt: '2024-03-10T09:15:00Z',
      updatedAt: '2024-03-10T09:15:00Z',
    },
  ];

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
      title: '是否保密',
      dataIndex: 'isConfidential',
      key: 'isConfidential',
      width: 100,
      render: (value: boolean) => (value ? '是' : '否'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Case) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/cases/${record.id}`)}>
            查看
          </Button>
          <Button type="link">编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          案件列表
        </Title>
        <Button type="primary" icon={<PlusOutlined />}>
          新增案件
        </Button>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <Search
          placeholder="搜索案件编号、标题..."
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 300 }}
          onSearch={(value) => console.log('搜索:', value)}
        />
        <Select placeholder="案件类型" style={{ width: 150 }} allowClear>
          <Option value="contract">合同纠纷</Option>
          <Option value="construction">建筑工程</Option>
          <Option value="equity">股权纠纷</Option>
        </Select>
        <Select placeholder="是否保密" style={{ width: 120 }} allowClear>
          <Option value={true}>是</Option>
          <Option value={false}>否</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        pagination={{
          total: 100,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
    </div>
  );
};

export default CaseList;
