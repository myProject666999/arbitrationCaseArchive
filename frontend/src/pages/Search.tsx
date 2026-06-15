import React, { useState } from 'react';
import { Typography, Input, Button, Card, List, Tag, Space, Empty } from 'antd';
import { SearchOutlined, FileTextOutlined, FolderOpenOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { SearchResult } from '../services/types';

const { Title } = Typography;
const { Search } = Input;

const SearchPage: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const mockResults: SearchResult[] = [
    {
      type: 'case',
      id: 1,
      title: '(2024)仲字第001号 - 某科技公司合同纠纷案',
      highlight: '...<mark>买卖合同</mark>纠纷一案，申请人某科技有限公司与被申请人某贸易有限公司于2023年签订...',
    },
    {
      type: 'document',
      id: 1,
      title: '买卖合同.pdf',
      highlight: '...<mark>买卖合同</mark>\n\n甲方：某科技有限公司\n乙方：某贸易有限公司\n\n鉴于甲方需向乙方采购...',
    },
    {
      type: 'document',
      id: 2,
      title: '付款凭证.pdf',
      highlight: '...根据双方签订的<mark>买卖合同</mark>，甲方应于货到后30日内支付全部货款...',
    },
    {
      type: 'volume',
      id: 1,
      title: '证据卷一',
      highlight: '...包含<mark>买卖合同</mark>、付款凭证、送货单等相关证据材料...',
    },
  ];

  const handleSearch = async (value: string) => {
    if (!value.trim()) return;
    setKeyword(value);
    setSearching(true);
    setSearched(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setResults(mockResults);
    setSearching(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'case':
        return <HomeOutlined />;
      case 'volume':
        return <FolderOpenOutlined />;
      case 'document':
        return <FileTextOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'case':
        return '案件';
      case 'volume':
        return '卷册';
      case 'document':
        return '文件';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'case':
        return 'blue';
      case 'volume':
        return 'green';
      case 'document':
        return 'orange';
      default:
        return 'default';
    }
  };

  const handleItemClick = (item: SearchResult) => {
    switch (item.type) {
      case 'case':
        navigate(`/cases/${item.id}`);
        break;
      case 'document':
        navigate(`/documents/${item.id}`);
        break;
      case 'volume':
        navigate('/cases');
        break;
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        全文搜索
      </Title>

      <Card style={{ marginBottom: 24 }}>
        <Search
          placeholder="输入关键词搜索案件、卷册、文件内容..."
          allowClear
          enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
          size="large"
          onSearch={handleSearch}
          loading={searching}
        />
        <div style={{ marginTop: 16 }}>
          <span style={{ color: '#999', marginRight: 16 }}>热门搜索：</span>
          <Space wrap>
            {['买卖合同', '股权转让', '建筑工程', '借款合同', '租赁合同'].map((tag) => (
              <Tag key={tag} color="blue" style={{ cursor: 'pointer' }} onClick={() => handleSearch(tag)}>
                {tag}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>

      {searched ? (
        <Card title={`搜索结果 (${results.length})`} extra={<span style={{ color: '#999' }}>关键词: "{keyword}"</span>}>
          {results.length > 0 ? (
            <List
              dataSource={results}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '16px 0' }}
                  onClick={() => handleItemClick(item)}
                >
                  <List.Item.Meta
                    avatar={getIcon(item.type)}
                    title={
                      <Space>
                        <Tag color={getTypeColor(item.type)}>{getTypeLabel(item.type)}</Tag>
                        <span>{item.title}</span>
                      </Space>
                    }
                    description={
                      <p
                        style={{ margin: 0 }}
                        dangerouslySetInnerHTML={{ __html: item.highlight || '' }}
                      />
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="未找到相关结果" />
          )}
        </Card>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <SearchOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>请输入关键词进行搜索</p>
            <p style={{ fontSize: 12 }}>支持搜索案件编号、标题、文件OCR内容等</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchPage;
