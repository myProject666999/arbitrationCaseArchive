const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 3001;

app.use(cors());
app.use(express.json());

const ocrTemplates = {
  '仲裁申请书': `仲裁申请书
申请人：张三，男，1980年1月1日出生，汉族，住北京市朝阳区xxx路xxx号。
被申请人：李四，男，1975年5月5日出生，汉族，住北京市海淀区xxx路xxx号。
仲裁请求：
1. 裁决被申请人支付合同违约金人民币50万元；
2. 裁决被申请人承担本案仲裁费用。
事实与理由：
申请人与被申请人于2023年1月1日签订《买卖合同》，约定申请人向被申请人购买货物，总价款人民币200万元。合同签订后，申请人依约支付了全部货款，但被申请人未能按约定时间交付货物，已构成违约。根据合同约定，被申请人应按日支付逾期交货违约金。截至2023年6月1日，被申请人已逾期交货150天，应支付违约金人民币50万元。为维护申请人的合法权益，特向贵委申请仲裁。`,

  '答辩书': `答辩书
答辩人：李四，男，1975年5月5日出生，汉族，住北京市海淀区xxx路xxx号。
就申请人张三诉答辩人买卖合同纠纷一案，答辩人现提出如下答辩意见：
一、答辩人未能按约定时间交货是由于不可抗力原因造成的。2023年2月，答辩人所在地发生重大疫情，政府实施了封控管理，导致工厂停产，无法正常生产和交货。根据《民法典》第一百八十条的规定，因不可抗力不能履行民事义务的，不承担民事责任。
二、即使答辩人应承担违约责任，申请人主张的违约金也过高，请求予以适当减少。根据合同约定，违约金按日万分之五计算，明显高于申请人的实际损失。根据《民法典》第五百八十五条的规定，约定的违约金过分高于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以适当减少。
综上，请求仲裁庭依法驳回申请人的仲裁请求或适当减少违约金数额。`,

  '证据清单': `证据清单
提交人：张三
提交日期：2023年6月1日
序号 证据名称 证据来源 证明内容
1 买卖合同 双方签订 证明申请人与被申请人之间存在买卖合同关系，以及双方的权利义务
2 付款凭证 银行出具 证明申请人已依约支付全部货款人民币200万元
3 交货通知书 被申请人出具 证明被通知应于2023年2月1日前交货
4 催告函 申请人发出 证明申请人多次催告被申请人交货
5 损失计算表 申请人制作 证明因被申请人逾期交货给申请人造成的损失
6 聊天记录 双方微信 证明被申请人承认逾期交货的事实`,

  '仲裁裁决书': `仲裁裁决书
（2023）京仲字第xxx号
申请人：张三，男，1980年1月1日出生，汉族，住北京市朝阳区xxx路xxx号。
被申请人：李四，男，1975年5月5日出生，汉族，住北京市海淀区xxx路xxx号。
北京仲裁委员会（以下简称本委）根据申请人张三与被申请人李四于2023年1月1日签订的《买卖合同》中的仲裁条款，以及申请人于2023年6月1日向本委提交的仲裁申请，于2023年6月10日受理了本案。
本案由仲裁员王某某独任审理。本委于2023年7月1日依法不公开开庭审理了本案。申请人张三及其委托代理人赵某某，被申请人李四及其委托代理人孙某某到庭参加了庭审。本案现已审理终结。
经审理查明：
一、2023年1月1日，申请人与被申请人签订《买卖合同》，约定申请人向被申请人购买货物，总价款人民币200万元，被申请人应于2023年2月1日前交货，逾期交货按日万分之五支付违约金。
二、合同签订后，申请人于2023年1月5日支付了全部货款人民币200万元。
三、被申请人因疫情原因未能按约定时间交货，实际交货时间为2023年4月15日，逾期交货73天。
本委认为：
一、关于不可抗力。被申请人主张因疫情原因未能交货属于不可抗力，本委予以采信。但被申请人在疫情缓解后未及时履行交货义务，存在一定过错。
二、关于违约金。申请人主张的违约金计算标准过高，本委酌情调整为按日万分之三计算。
裁决如下：
一、被申请人李四于本裁决书送达之日起十日内支付申请人张三违约金人民币43.8万元；
二、本案仲裁费用人民币2万元，由申请人承担30%即6000元，被申请人承担70%即14000元。
本裁决为终局裁决，自作出之日起发生法律效力。
仲裁员：王某某
2023年7月15日`,

  '借款合同': `借款合同
出借人（甲方）：王五，男，1978年3月3日出生，汉族，住北京市西城区xxx路xxx号。
借款人（乙方）：赵六，男，1982年8月8日出生，汉族，住北京市东城区xxx路xxx号。
保证人（丙方）：孙七，男，1970年10月10日出生，汉族，住北京市丰台区xxx路xxx号。
鉴于乙方因资金周转需要向甲方借款，丙方同意为乙方的借款提供连带责任保证担保，三方经协商一致，达成如下协议：
第一条 借款金额：人民币100万元整。
第二条 借款期限：自2023年1月1日起至2023年6月30日止。
第三条 借款利率：年利率12%，按月付息，到期还本。
第四条 保证条款：丙方同意为乙方的借款提供连带责任保证担保，保证范围包括借款本金、利息、违约金以及甲方实现债权的费用，保证期间为债务履行期限届满之日起两年。
第五条 违约责任：乙方如逾期还款，应按日万分之五支付逾期违约金。
第六条 争议解决：因本合同引起的或与本合同有关的任何争议，均提交北京仲裁委员会仲裁。
本合同一式三份，甲、乙、丙三方各执一份，自各方签字之日起生效。
甲方（签字）：王五 日期：2023年1月1日
乙方（签字）：赵六 日期：2023年1月1日
丙方（签字）：孙七 日期：2023年1月1日`,

  'default': `仲裁文档
文档编号：DOC-${Date.now()}
文档类型：其他仲裁相关文档
内容摘要：
本文档为仲裁案件相关材料，包含案件审理过程中的重要文件和证据资料。
文档内容涉及仲裁程序、证据交换、庭审记录等多个方面。
请注意保密，仅限仲裁相关人员查阅使用。
归档日期：${new Date().toLocaleDateString('zh-CN')}
归档人员：系统自动归档`
};

function getTemplateByFilename(filename) {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('仲裁申请') || lowerName.includes('申请书')) {
    return ocrTemplates['仲裁申请书'];
  } else if (lowerName.includes('答辩') || lowerName.includes('答辩状')) {
    return ocrTemplates['答辩书'];
  } else if (lowerName.includes('证据') || lowerName.includes('证据清单')) {
    return ocrTemplates['证据清单'];
  } else if (lowerName.includes('裁决') || lowerName.includes('裁决书') || lowerName.includes('仲裁裁决')) {
    return ocrTemplates['仲裁裁决书'];
  } else if (lowerName.includes('借款') || lowerName.includes('合同')) {
    return ocrTemplates['借款合同'];
  }
  
  const keys = Object.keys(ocrTemplates).filter(k => k !== 'default');
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return ocrTemplates[randomKey];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /health - 健康检查`);
  res.json({
    status: 'ok',
    service: 'ocr-simulator',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/ocr', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  const filename = req.file ? req.file.originalname : 'unknown';
  
  console.log(`[${new Date().toISOString()}] POST /ocr - 开始处理文件: ${filename}`);
  console.log(`[${new Date().toISOString()}] 文件大小: ${req.file ? req.file.size : 0} bytes`);
  
  try {
    const delayTime = 1000 + Math.random() * 2000;
    console.log(`[${new Date().toISOString()}] 模拟OCR处理，预计耗时: ${Math.round(delayTime)}ms`);
    await delay(delayTime);
    
    const text = getTemplateByFilename(filename);
    const confidence = Math.round((85 + Math.random() * 15) * 100) / 100;
    const processingTime = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] OCR处理完成，置信度: ${confidence}%，耗时: ${processingTime}ms`);
    
    res.json({
      success: true,
      text: text,
      confidence: confidence,
      engine: 'Tesseract-Simulator',
      processingTime: processingTime
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] OCR处理失败: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
      engine: 'Tesseract-Simulator',
      processingTime: Date.now() - startTime
    });
  }
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] OCR模拟服务已启动`);
  console.log(`[${new Date().toISOString()}] 监听端口: ${PORT}`);
  console.log(`[${new Date().toISOString()}] 健康检查: http://localhost:${PORT}/health`);
  console.log(`[${new Date().toISOString()}] OCR接口: POST http://localhost:${PORT}/ocr`);
});
