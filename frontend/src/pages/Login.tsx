import React, { useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, loading } = useAuthStore();
  const redirectedRef = useRef(false);

  const state = location.state as LocationState;
  const redirectFromState = state?.from?.pathname || '/';
  const redirectFromQuery = searchParams.get('redirect') || '';
  const from = redirectFromQuery || redirectFromState;

  useEffect(() => {
    if (isAuthenticated && !redirectedRef.current) {
      redirectedRef.current = true;
      const safeRedirect = from && from.startsWith('/') && from !== '/login' ? from : '/';
      navigate(safeRedirect, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (redirectFromQuery && redirectFromQuery !== '/login') {
      message.info('登录已过期，请重新登录');
    }
  }, [redirectFromQuery]);

  const onFinish = async (values: { username: string; password: string }) => {
    const success = await login(values);
    if (success) {
      const safeRedirect = from && from.startsWith('/') && from !== '/login' ? from : '/';
      navigate(safeRedirect, { replace: true });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            仲裁档案管理系统
          </Title>
          <p style={{ color: '#666', marginTop: 8 }}>请登录以继续</p>
        </div>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
