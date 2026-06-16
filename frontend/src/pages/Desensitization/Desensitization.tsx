import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Tree,
  Button,
  Switch,
  Space,
  List,
  Tag,
  message,
  Typography,
  Divider,
  Empty,
  Spin,
  Alert,
  Modal,
} from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  SaveOutlined,
  HistoryOutlined,
  LockOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import dayjs from 'dayjs';
import type { Document, OcrVersion, DesensitizationRules, DesensitizedVersion, DesensitizationResult } from '@/services/types';
import { documentApi, desensitizationApi, caseApi, volumeApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const { Title, Text, Paragraph } = Typography;

interface TreeNodeData extends TreeDataNode {
  type: 'case' | 'volume' | 'document';
  data?: any;
  children?: TreeNodeData[];
}

interface RuleItem {
  key: keyof DesensitizationRules;
  label: string;
  description: string;
}

const ruleItems: RuleItem[] = [
  { key: 'name', label: '姓名', description: '脱敏中文姓名' },
  { key: 'idCard', label: '身份证号', description: '脱敏18位身份证号码' },
  { key: 'phone', label: '手机号码', description: '脱敏11位手机号码' },
  { key: 'email', label: '邮箱地址', description: '脱敏邮箱地址' },
  { key: 'address', label: '地址信息', description: '脱敏详细地址' },
  { key: 'bankCard', label: '银行卡号', description: '脱敏银行卡号码' },
];

const defaultRules: DesensitizationRules = {
  name: true,
  idCard: true,
  phone: true,
  email: true,
  address: false,
  bankCard: false,
  companyName: false,
};

const Desensitization = () => {
  const { isLibrarian } = useAuthStore();
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [ocrVersion, setOcrVersion] = useState<OcrVersion | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<DesensitizationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [rules, setRules] = useState<DesensitizationRules>(defaultRules);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [desensitizationHistory, setDesensitizationHistory] = useState<DesensitizedVersion[]>([]);
  const [textLoading, setTextLoading] = useState(false);

  const loadConfidentialCases = async () => {
    setTreeLoading(true);
    try {
      const response = await caseApi.getCaseList(1, 1000);
      const confidentialCases = response.items.filter(c => c.isConfidential);
      const treeNodes: TreeNodeData[] = confidentialCases.map(caseItem => ({
        key: `case-${caseItem.id}`,
        title: caseItem.caseTitle,
        type: 'case',
        data: caseItem,
        isLeaf: false,
        icon: <LockOutlined />,
      }));
      setTreeData(treeNodes);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载涉密案件列表失败');
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    if (isLibrarian()) {
      loadConfidentialCases();
    }
  }, []);

  const loadVolumes = async (caseId: number): Promise<TreeNodeData[]> => {
    try {
      const volumes = await volumeApi.getVolumesByCase(caseId);
      return volumes.map(volume => ({
        key: `volume-${volume.id}`,
        title: volume.volumeName,
        type: 'volume',
        data: volume,
        isLeaf: false,
        icon: <FileTextOutlined />,
      }));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载卷册列表失败');
      return [];
    }
  };

  const loadDocuments = async (volumeId: number): Promise<TreeNodeData[]> => {
    try {
      const documents = await documentApi.getDocumentsByVolume(volumeId);
      return documents
        .filter(doc => doc.ocrStatus === 'completed')
        .map(doc => ({
          key: `document-${doc.id}`,
          title: doc.documentName,
          type: 'document',
          data: doc,
          isLeaf: true,
          icon: <FileTextOutlined />,
        }));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载文件列表失败');
      return [];
    }
  };

  const handleTreeLoadData = async (treeNode: any) => {
    const { key, type } = treeNode.props;
    
    if (type === 'case') {
      const caseId = parseInt(key.split('-')[1]);
      const volumes = await loadVolumes(caseId);
      setTreeData(prev => {
        const updateTree = (nodes: TreeNodeData[]): TreeNodeData[] => {
          return nodes.map(node => {
            if (node.key === key) {
              return { ...node, children: volumes };
            }
            if (node.children) {
              return { ...node, children: updateTree(node.children) };
            }
            return node;
          });
        };
        return updateTree(prev);
      });
    } else if (type === 'volume') {
      const volumeId = parseInt(key.split('-')[1]);
      const documents = await loadDocuments(volumeId);
      setTreeData(prev => {
        const updateTree = (nodes: TreeNodeData[]): TreeNodeData[] => {
          return nodes.map(node => {
            if (node.key === key) {
              return { ...node, children: documents };
            }
            if (node.children) {
              return { ...node, children: updateTree(node.children) };
            }
            return node;
          });
        };
        return updateTree(prev);
      });
    }
  };

  const handleTreeSelect = async (keys: React.Key[], info: any) => {
    setSelectedKeys(keys);
    setPreviewResult(null);
    setShowPreview(false);
    
    if (keys.length > 0 && info.node.type === 'document') {
      const doc = info.node.data as Document;
      setSelectedDocument(doc);
      
      setTextLoading(true);
      try {
        const [version, text] = await Promise.all([
          documentApi.getLatestOCRVersion(doc.id),
          documentApi.getOCRText(doc.id),
        ]);
        setOcrVersion(version);
        setOcrText(text);
        loadHistory(version.id);
      } catch (error) {
        message.error(error instanceof Error ? error.message : '加载OCR文本失败');
      } finally {
        setTextLoading(false);
      }
    } else {
      setSelectedDocument(null);
      setOcrVersion(null);
      setOcrText('');
      setDesensitizationHistory([]);
    }
  };

  const loadHistory = async (ocrVersionId: number) => {
    setHistoryLoading(true);
    try {
      const history = await desensitizationApi.getDesensitizationHistory(ocrVersionId);
      setDesensitizationHistory(history);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载脱敏历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRuleChange = (key: keyof DesensitizationRules, checked: boolean) => {
    setRules(prev => ({ ...prev, [key]: checked }));
    setPreviewResult(null);
    setShowPreview(false);
  };

  const handlePreview = async () => {
    if (!ocrVersion) {
      message.warning('请先选择文件');
      return;
    }
    
    const hasSelectedRule = Object.values(rules).some(v => v);
    if (!hasSelectedRule) {
      message.warning('请至少选择一项脱敏规则');
      return;
    }

    setPreviewLoading(true);
    try {
      const result = await desensitizationApi.previewDesensitization(ocrVersion.id, rules);
      setPreviewResult(result);
      setShowPreview(true);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '预览失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApply = async () => {
    if (!ocrVersion) {
      message.warning('请先选择文件');
      return;
    }
    
    const hasSelectedRule = Object.values(rules).some(v => v);
    if (!hasSelectedRule) {
      message.warning('请至少选择一项脱敏规则');
      return;
    }

    Modal.confirm({
      title: '确认应用脱敏',
      content: '应用脱敏后将创建新的脱敏版本，确定要继续吗？',
      onOk: async () => {
        setApplyLoading(true);
        try {
          await desensitizationApi.applyDesensitization(ocrVersion.id, rules);
          message.success('脱敏版本已保存');
          loadHistory(ocrVersion.id);
          setPreviewResult(null);
          setShowPreview(false);
        } catch (error) {
          message.error(error instanceof Error ? error.message : '保存失败');
        } finally {
          setApplyLoading(false);
        }
      },
    });
  };

  const handleViewHistory = (item: DesensitizedVersion) => {
    setPreviewResult({
      originalText: ocrText,
      desensitizedText: item.desensitizedText || '',
      desensitizedCount: item.desensitizedCount,
    } as DesensitizationResult);
    setShowPreview(true);
  };

  const handleTreeExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys);
  };

  const handleResetRules = () => {
    setRules(defaultRules);
    setPreviewResult(null);
    setShowPreview(false);
  };

  if (!isLibrarian()) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="warning"
          message="权限不足"
          description="您没有权限访问脱敏处理功能，请联系管理员。"
        />
      </div>
    );
  }

  const activeRuleCount = Object.values(rules).filter(Boolean).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>脱敏处理</Title>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card 
            title="涉密文件" 
            size="small"
            style={{ height: 'calc(100vh - 180px)' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto', padding: 0 }}
          >
            <Tree
              showIcon
              loadData={handleTreeLoadData}
              treeData={treeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onExpand={handleTreeExpand}
              onSelect={handleTreeSelect}
              blockNode
              style={{ padding: '8px 0' }}
            />
          </Card>
        </Col>

        <Col span={10}>
          <Card 
            title={showPreview ? '脱敏预览' : 'OCR原文'} 
            size="small"
            style={{ height: 'calc(100vh - 180px)' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
            extra={
              selectedDocument && (
                <Space>
                  <Button
                    type={showPreview ? 'primary' : 'default'}
                    size="small"
                    icon={showPreview ? <FileTextOutlined /> : <EyeOutlined />}
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={!showPreview && !previewResult}
                  >
                    {showPreview ? '查看原文' : '查看脱敏'}
                  </Button>
                </Space>
              )
            }
          >
            {textLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Spin tip="加载中..." />
              </div>
            ) : selectedDocument && ocrText ? (
              <div>
                {showPreview && previewResult && (
                  <Alert
                    type="info"
                    showIcon
                    message={`已脱敏 ${previewResult.desensitizedCount} 处敏感信息`}
                    style={{ marginBottom: 16 }}
                  />
                )}
                <Paragraph 
                  style={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: 14,
                    lineHeight: 1.8,
                    background: showPreview ? '#fff7e6' : '#fafafa',
                    padding: 16,
                    borderRadius: 4,
                  }}
                >
                  {showPreview && previewResult ? previewResult.desensitizedText : ocrText}
                </Paragraph>
              </div>
            ) : (
              <Empty description="请从左侧选择涉密文件" />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            title="脱敏规则配置" 
            size="small"
            style={{ marginBottom: 16 }}
            extra={
              <Button 
                type="text" 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={handleResetRules}
              >
                重置
              </Button>
            }
          >
            <List
              size="small"
              dataSource={ruleItems}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Switch
                      key="switch"
                      checked={!!rules[item.key]}
                      onChange={(checked) => handleRuleChange(item.key, checked)}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={item.label}
                    description={<Text type="secondary">{item.description}</Text>}
                  />
                </List.Item>
              )}
            />
            
            <Divider style={{ margin: '16px 0' }} />
            
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">已选择 {activeRuleCount} 项规则</Text>
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                  loading={previewLoading}
                  disabled={!selectedDocument || activeRuleCount === 0}
                >
                  预览
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleApply}
                  loading={applyLoading}
                  disabled={!selectedDocument || activeRuleCount === 0}
                >
                  应用
                </Button>
              </Space>
            </Space>
          </Card>

          <Card 
            title={
              <Space>
                <HistoryOutlined />
                <span>脱敏历史</span>
              </Space>
            } 
            size="small"
            style={{ height: 'calc(100vh - 420px)' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            {historyLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <Spin />
              </div>
            ) : desensitizationHistory.length > 0 ? (
              <List
                size="small"
                dataSource={desensitizationHistory}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<EyeOutlined />}
                        onClick={() => handleViewHistory(item)}
                      >
                        查看
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={`版本 v${item.id}`}
                      description={
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                          <div>
                            {Object.entries(item.desensitizationRules || {})
                              .filter(([, v]) => v)
                              .map(([k]) => {
                                const rule = ruleItems.find(r => r.key === k);
                                return rule ? (
                                  <Tag key={k} color="blue" style={{ marginBottom: 4 }}>
                                    {rule.label}
                                  </Tag>
                                ) : null;
                              })}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            脱敏 {item.desensitizedCount} 处
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无脱敏历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Desensitization;
