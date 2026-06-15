import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Alert,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { User, UserRole, CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from '@/services/types';
import { userApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;
const { Option } = Select;

const roleMap: Record<UserRole, { text: string; color: string }> = {
  admin: { text: '管理员', color: 'red' },
  librarian: { text: '档案员', color: 'blue' },
  user: { text: '普通用户', color: 'green' },
};

interface UserFormData extends CreateUserRequest {}

const UserList = () => {
  const { isAdmin, user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm<UserFormData>();
  const [passwordForm] = Form.useForm<ChangePasswordRequest>();
  const [modalTitle, setModalTitle] = useState('新增用户');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await userApi.getUserList(page, pageSize);
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin()) {
      fetchData();
    }
  }, [page, pageSize]);

  const handleAdd = () => {
    setEditingUser(null);
    setModalTitle('新增用户');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    setModalTitle('编辑用户');
    form.setFieldsValue({
      username: record.username,
      realName: record.realName,
      role: record.role,
      department: record.department,
      phone: record.phone,
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: User) => {
    try {
      await userApi.deleteUser(record.id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          realName: values.realName,
          role: values.role,
          department: values.department,
          phone: values.phone,
        };
        await userApi.updateUser(editingUser.id, updateData);
        message.success('更新成功');
      } else {
        await userApi.createUser(values);
        message.success('创建成功');
      }
      
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '操作失败');
      }
    }
  };

  const handleResetPassword = (record: User) => {
    setEditingUser(record);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  const handlePasswordSubmit = async () => {
    if (!editingUser) return;
    try {
      const values = await passwordForm.validateFields();
      await userApi.changePassword(editingUser.id, {
        newPassword: values.newPassword,
      });
      message.success('密码重置成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '密码重置失败');
      }
    }
  };

  const handleToggleStatus = async (record: User, checked: boolean) => {
    try {
      await userApi.toggleUserStatus(record.id);
      message.success(checked ? '用户已启用' : '用户已禁用');
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败');
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole) => {
        const config = roleMap[role];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      ellipsis: true,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active: boolean, record) => (
        <Switch
          checked={active}
          checkedChildren={<UnlockOutlined />}
          unCheckedChildren={<LockOutlined />}
          disabled={currentUser?.id === record.id}
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => {
        const isCurrentUser = currentUser?.id === record.id;
        return (
          <Space size="middle">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={isCurrentUser && record.role === 'admin'}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record)}
            >
              重置密码
            </Button>
            <Popconfirm
              title="确定删除该用户吗？"
              description="删除后无法恢复，请谨慎操作"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
              disabled={isCurrentUser}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isCurrentUser}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  if (!isAdmin()) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="warning"
          message="权限不足"
          description="您没有权限访问用户管理功能，请联系管理员。"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>用户管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增用户
        </Button>
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
        scroll={{ x: 1300 }}
      />

      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 50, message: '用户名长度为3-50个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          
          {!editingUser && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[
                { required: true, message: '请输入初始密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}
          
          <Form.Item
            name="realName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="librarian">档案员</Option>
              <Option value="user">普通用户</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="department"
            label="部门"
          >
            <Input placeholder="请输入部门" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="联系电话"
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={passwordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={() => setPasswordModalVisible(false)}
        destroyOnClose
        okText="确认重置"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
