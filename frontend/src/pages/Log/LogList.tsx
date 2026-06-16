import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Typography,
  Alert,
  Card,
  Descriptions,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { OperationLog, User, LogQueryParams } from '@/services/types';
import { logApi, userApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const operationTypeMap: Record<string, { text: string; color: string }> = {
  login: { text: '登录', color: 'green' },
  logout: { text: '登出', color: 'default' },
  create: { text: '创建', color: 'blue' },
  update: { text: '更新', color: 'cyan' },
  delete: { text: '删除', color: 'red' },
  download: { text: '下载', color: 'purple' },
  export: { text: '导出', color: 'geekblue' },
  borrow: { text: '借阅', color: 'orange' },
  return: { text: '归还', color: 'green' },
  approve: { text: '审批', color: 'blue' },
  reject: { text: '拒绝', color: 'red' },
  desensitize: { text: '脱敏', color: 'purple' },
  ocr: { text: 'OCR处理', color: 'cyan' },
  search: { text: '搜索', color: 'default' },
};

const operationTypes = [
  'login', 'logout', 'create', 'update', 'delete',
  'download', 'export', 'borrow', 'return',
  'approve', 'reject', 'desensitize', 'ocr', 'search'
];

const LogList = () => {
  const { isAdmin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [users, setUsers] = useState<User[]>([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);
  const [filterForm] = Form.useForm<LogQueryParams>();

  const fetchUsers = async () => {
    try {
      const userList = await userApi.getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  const fetchData = async (params?: LogQueryParams) => {
    setLoading(true);
    try {
      const queryParams: LogQueryParams = {
        page,
        pageSize,
        ...params,
      };
      const response = await logApi.getLogList(queryParams);
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取日志列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
      fetchData();
    }
  }, [page, pageSize]);

  const handleSearch = async () => {
    try {
      const values = await filterForm.validateFields();
      let startTime: string | undefined;
      let endTime: string | undefined;
      
      if (values.startTime && values.endTime) {
        startTime = (values.startTime as any)?.format?.('YYYY-MM-DD HH:mm:ss');
        endTime = (values.endTime as any)?.format?.('YYYY-MM-DD HH:mm:ss');
      }
      
      setPage(1);
      fetchData({
        ...values,
        startTime,
        endTime,
        page: 1,
        pageSize,
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '搜索失败');
      }
    }
  };

  const handleReset = () => {
    filterForm.resetFields();
    setPage(1);
    fetchData();
  };

  const handleViewDetail = (record: OperationLog) => {
    setSelectedLog(record);
    setDetailModalVisible(true);
  };

  const getOperationTypeConfig = (type: string) => {
    return operationTypeMap[type] || { text: type, color: 'default' };
  };

  const formatDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  };

  const columns: ColumnsType<OperationLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '操作人',
      dataIndex: ['user', 'realName'],
      key: 'user',
      width: 120,
      render: (text: string, record) => {
        if (text) {
          return (
            <Space>
              <UserOutlined />
              <span>{text}</span>
            </Space>
          );
        }
        return record.userId ? `用户ID: ${record.userId}` : '系统';
      },
    },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      key: 'operationType',
      width: 120,
      render: (type: string) => {
        const config = getOperationTypeConfig(type);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 120,
      render: (type: string) => type || '-',
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 100,
      render: (id: number) => id || '-',
    },
    {
      title: '操作摘要',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (details: string) => {
        if (!details) return '-';
        try {
          const parsed = JSON.parse(details);
          if (parsed.action) return parsed.action;
          if (parsed.description) return parsed.description;
          return typeof parsed === 'object' ? '操作详情' : details.substring(0, 50);
        } catch {
          return details.substring(0, 50);
        }
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (ip: string) => ip || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  if (!isAdmin()) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="warning"
          message="权限不足"
          description="您没有权限访问操作日志功能，请联系管理员。"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>操作日志</Title>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="inline">
          <Form.Item name="userId" label="用户">
            <Select
              placeholder="请选择用户"
              style={{ width: 150 }}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.realName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="operationType" label="操作类型">
            <Select
              placeholder="请选择操作类型"
              style={{ width: 150 }}
              allowClear
            >
              {operationTypes.map(type => {
                const config = getOperationTypeConfig(type);
                return (
                  <Option key={type} value={type}>
                    {config.text}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          
          <Form.Item name={['startTime', 'endTime']} label="时间范围">
            <RangePicker showTime format="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

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
        scroll={{ x: 1400 }}
      />

      <Modal
        title="操作详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
        destroyOnHidden
      >
        {selectedLog && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="日志ID" span={1}>
              {selectedLog.id}
            </Descriptions.Item>
            <Descriptions.Item label="操作时间" span={1}>
              {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            
            <Descriptions.Item label="操作人" span={1}>
              {selectedLog.user?.realName || `用户ID: ${selectedLog.userId}` || '系统'}
            </Descriptions.Item>
            <Descriptions.Item label="用户名" span={1}>
              {selectedLog.user?.username || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label="操作类型" span={1}>
              {(() => {
                const config = getOperationTypeConfig(selectedLog.operationType);
                return <Tag color={config.color}>{config.text}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="IP地址" span={1}>
              {selectedLog.ipAddress || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label="目标类型" span={1}>
              {selectedLog.targetType || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="目标ID" span={1}>
              {selectedLog.targetId || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label="浏览器信息" span={2}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedLog.userAgent || '-'}
              </Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="操作详情" span={2}>
              {selectedLog.details ? (
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  maxHeight: 300,
                  overflow: 'auto',
                  margin: 0,
                  fontSize: 12,
                }}>
                  {formatDetails(selectedLog.details)}
                </pre>
              ) : (
                '-'
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default LogList;
