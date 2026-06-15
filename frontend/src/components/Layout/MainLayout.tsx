import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  HomeOutlined,
  FolderOpenOutlined,
  SearchOutlined,
  BookOutlined,
  SecurityScanOutlined,
  TagOutlined,
  UserOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const { Header, Sider, Content } = Layout;

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useAuthStore();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: '/cases',
      icon: <FolderOpenOutlined />,
      label: '目录浏览',
      onClick: () => navigate('/cases'),
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '全文搜索',
      onClick: () => navigate('/search'),
    },
    {
      key: '/borrow',
      icon: <BookOutlined />,
      label: '借阅管理',
      onClick: () => navigate('/borrow'),
    },
    {
      key: '/desensitization',
      icon: <SecurityScanOutlined />,
      label: '脱敏处理',
      onClick: () => navigate('/desensitization'),
    },
    {
      key: '/annotations',
      icon: <TagOutlined />,
      label: '标注管理',
      onClick: () => navigate('/annotations'),
    },
    ...(hasRole(['admin'])
      ? [
          {
            key: '/users',
            icon: <UserOutlined />,
            label: '用户管理',
            onClick: () => navigate('/users'),
          },
          {
            key: '/logs',
            icon: <FileTextOutlined />,
            label: '操作日志',
            onClick: () => navigate('/logs'),
          },
        ]
      : []),
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/cases/')) return '/cases';
    if (path.startsWith('/borrow/')) return '/borrow';
    return path;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {collapsed ? '仲裁' : '仲裁档案管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#666' }}>
              欢迎，{user?.realName || user?.username}
              <span style={{ marginLeft: 8, color: '#999' }}>
                ({user?.role === 'admin' ? '管理员' : user?.role === 'librarian' ? '档案员' : '普通用户'})
              </span>
            </span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}>
                {(user?.realName || user?.username || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
