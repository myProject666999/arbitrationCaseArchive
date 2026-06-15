-- 仲裁案件电子卷宗归档系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS arbitration_archive DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE arbitration_archive;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    role ENUM('admin', 'librarian', 'user') NOT NULL DEFAULT 'user' COMMENT '角色：admin-管理员，librarian-档案员，user-普通用户',
    department VARCHAR(100) COMMENT '部门',
    phone VARCHAR(20) COMMENT '联系电话',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 案件表（第一级目录）
CREATE TABLE IF NOT EXISTS cases (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    case_number VARCHAR(100) NOT NULL UNIQUE COMMENT '案号',
    case_title VARCHAR(255) NOT NULL COMMENT '案件标题',
    case_type VARCHAR(50) NOT NULL COMMENT '案件类型',
    case_cause VARCHAR(255) NOT NULL COMMENT '案由',
    applicant VARCHAR(255) COMMENT '申请人',
    respondent VARCHAR(255) COMMENT '被申请人',
    case_date DATE COMMENT '案件日期',
    summary TEXT COMMENT '案件摘要',
    is_confidential TINYINT(1) DEFAULT 0 COMMENT '是否涉密',
    created_by BIGINT COMMENT '创建人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT INDEX ft_case_content (case_number, case_title, case_cause, applicant, respondent, summary),
    INDEX idx_case_number (case_number),
    INDEX idx_case_type (case_type),
    INDEX idx_case_date (case_date),
    INDEX idx_is_confidential (is_confidential),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='案件表';

-- 卷册表（第二级目录）
CREATE TABLE IF NOT EXISTS volumes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    case_id BIGINT NOT NULL COMMENT '所属案件ID',
    volume_number INT NOT NULL COMMENT '卷册号',
    volume_name VARCHAR(255) NOT NULL COMMENT '卷册名称',
    description TEXT COMMENT '卷册描述',
    page_count INT DEFAULT 0 COMMENT '页数',
    created_by BIGINT COMMENT '创建人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_case_id (case_id),
    INDEX idx_volume_number (volume_number),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_case_volume (case_id, volume_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='卷册表';

-- 文件表（第三级目录）
CREATE TABLE IF NOT EXISTS documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    volume_id BIGINT NOT NULL COMMENT '所属卷册ID',
    document_name VARCHAR(255) NOT NULL COMMENT '文件名称',
    document_type VARCHAR(50) COMMENT '文件类型',
    file_path VARCHAR(500) COMMENT '文件存储路径',
    file_size BIGINT COMMENT '文件大小（字节）',
    page_number INT COMMENT '页码',
    scan_date DATE COMMENT '扫描日期',
    ocr_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT 'OCR处理状态',
    latest_ocr_version_id BIGINT COMMENT '最新OCR版本ID',
    version INT DEFAULT 1 COMMENT '乐观锁版本号',
    created_by BIGINT COMMENT '创建人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_volume_id (volume_id),
    INDEX idx_document_name (document_name),
    INDEX idx_ocr_status (ocr_status),
    INDEX idx_version (version),
    FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件表';

-- OCR版本表（支持增量更新和版本管理）
CREATE TABLE IF NOT EXISTS ocr_versions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL COMMENT '文件ID',
    version_number INT NOT NULL COMMENT '版本号',
    ocr_text MEDIUMTEXT COMMENT 'OCR识别文本',
    ocr_engine VARCHAR(50) COMMENT 'OCR引擎',
    confidence_score DECIMAL(5,2) COMMENT '置信度分数',
    is_incremental TINYINT(1) DEFAULT 0 COMMENT '是否增量更新',
    incremental_changes TEXT COMMENT '增量变更内容（JSON格式）',
    processed_by BIGINT COMMENT '处理人ID',
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FULLTEXT INDEX ft_ocr_text (ocr_text),
    INDEX idx_document_id (document_id),
    INDEX idx_version_number (version_number),
    INDEX idx_processed_at (processed_at),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uk_doc_version (document_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='OCR版本表';

-- 借阅记录表
CREATE TABLE IF NOT EXISTS borrow_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL COMMENT '文件ID',
    applicant_id BIGINT NOT NULL COMMENT '申请人ID',
    approver_id BIGINT COMMENT '审批人ID',
    borrow_reason TEXT COMMENT '借阅理由',
    borrow_type ENUM('view', 'download', 'export') DEFAULT 'view' COMMENT '借阅类型：view-查看，download-下载，export-导出',
    status ENUM('pending', 'approved', 'rejected', 'returned', 'overdue', 'lost') DEFAULT 'pending' COMMENT '状态：pending-待审批，approved-已批准，rejected-已拒绝，returned-已归还，overdue-已逾期，lost-已丢失',
    borrow_date DATE COMMENT '借阅日期',
    due_date DATE COMMENT '应还日期',
    return_date DATE COMMENT '实际归还日期',
    rejection_reason TEXT COMMENT '拒绝理由',
    is_reminded TINYINT(1) DEFAULT 0 COMMENT '是否已催还',
    reminder_count INT DEFAULT 0 COMMENT '催还次数',
    last_reminder_at DATETIME COMMENT '最后催还时间',
    compensation_amount DECIMAL(10,2) DEFAULT 0 COMMENT '赔偿金额',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_document_id (document_id),
    INDEX idx_applicant_id (applicant_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_is_reminded (is_reminded),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='借阅记录表';

-- 脱敏版本表
CREATE TABLE IF NOT EXISTS desensitized_versions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ocr_version_id BIGINT NOT NULL COMMENT '原始OCR版本ID',
    desensitized_text MEDIUMTEXT COMMENT '脱敏后文本',
    desensitization_rules JSON COMMENT '脱敏规则配置',
    desensitized_count INT DEFAULT 0 COMMENT '脱敏字段数量',
    processed_by BIGINT COMMENT '处理人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ocr_version_id (ocr_version_id),
    FULLTEXT INDEX ft_desensitized_text (desensitized_text),
    FOREIGN KEY (ocr_version_id) REFERENCES ocr_versions(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='脱敏版本表';

-- 标注表（支持乐观锁并发控制）
CREATE TABLE IF NOT EXISTS annotations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    document_id BIGINT NOT NULL COMMENT '文件ID',
    ocr_version_id BIGINT COMMENT 'OCR版本ID',
    annotator_id BIGINT NOT NULL COMMENT '标注人ID',
    annotation_type VARCHAR(50) COMMENT '标注类型',
    content TEXT NOT NULL COMMENT '标注内容',
    page_position JSON COMMENT '页面位置信息',
    version INT DEFAULT 1 COMMENT '乐观锁版本号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_document_id (document_id),
    INDEX idx_annotator_id (annotator_id),
    INDEX idx_ocr_version_id (ocr_version_id),
    INDEX idx_version (version),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (ocr_version_id) REFERENCES ocr_versions(id) ON DELETE SET NULL,
    FOREIGN KEY (annotator_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标注表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT COMMENT '操作用户ID',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) COMMENT '目标类型',
    target_id BIGINT COMMENT '目标ID',
    details TEXT COMMENT '操作详情',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT '用户代理',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 插入初始测试数据
-- 插入管理员用户（密码: admin123，需要在应用中通过bcrypt哈希后存储）
INSERT INTO users (username, password_hash, real_name, role, department, phone) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '系统管理员', 'admin', '技术部', '13800138000'),
('librarian1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '张档案', 'librarian', '档案室', '13800138001'),
('user1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '李用户', 'user', '业务一部', '13800138002'),
('user2', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '王仲裁', 'user', '仲裁庭', '13800138003');

-- 插入测试案件数据
INSERT INTO cases (case_number, case_title, case_type, case_cause, applicant, respondent, case_date, summary, is_confidential, created_by) VALUES
('(2024)仲字第001号', 'A公司与B公司买卖合同纠纷案', '商事仲裁', '买卖合同纠纷', 'A科技有限公司', 'B贸易有限公司', '2024-01-15', '申请人A公司与被申请人B公司于2023年签订买卖合同，被申请人未按约定支付货款，申请人申请仲裁要求支付货款及违约金共计人民币500万元。', 0, 2),
('(2024)仲字第002号', '张三与李四劳动争议案', '劳动仲裁', '劳动争议', '张三', '李四', '2024-02-20', '申请人张三主张被申请人李四经营的公司未与其签订劳动合同，要求支付双倍工资及经济补偿金共计人民币30万元。', 0, 2),
('(2024)仲字第003号', '某涉密单位合同纠纷案', '商事仲裁', '建设工程合同纠纷', '某涉密单位', 'C建设工程有限公司', '2024-03-10', '涉及某涉密单位的建设工程合同纠纷，因涉及国家秘密，本案按涉密案件管理。', 1, 2),
('(2024)仲字第004号', 'D公司与E公司股权转让纠纷案', '商事仲裁', '股权转让纠纷', 'D投资有限公司', 'E控股集团', '2024-04-05', '双方因股权转让协议履行产生争议，涉及金额约2000万元。', 0, 2);

-- 插入测试卷册数据
INSERT INTO volumes (case_id, volume_number, volume_name, description, page_count, created_by) VALUES
(1, 1, '正卷第一册', '包含仲裁申请书、证据材料、答辩状等', 120, 2),
(1, 2, '正卷第二册', '包含庭审记录、代理意见、裁决书等', 85, 2),
(1, 3, '副卷', '包含合议庭评议记录、审委会讨论记录等', 45, 2),
(2, 1, '正卷', '劳动争议案件全部材料', 60, 2),
(3, 1, '涉密正卷', '涉密案件材料', 90, 2),
(3, 2, '涉密副卷', '涉密案件内部材料', 50, 2),
(4, 1, '正卷第一册', '股权转让纠纷材料', 150, 2);

-- 插入测试文件数据
INSERT INTO documents (volume_id, document_name, document_type, file_path, file_size, page_number, scan_date, ocr_status, latest_ocr_version_id, created_by) VALUES
(1, '仲裁申请书.pdf', '申请书', '/files/case1/vol1/001_仲裁申请书.pdf', 1024000, 1, '2024-01-20', 'completed', 1, 2),
(1, '证据材料一.pdf', '证据', '/files/case1/vol1/002_证据材料一.pdf', 2048000, 15, '2024-01-20', 'completed', 2, 2),
(1, '证据材料二.pdf', '证据', '/files/case1/vol1/003_证据材料二.pdf', 1536000, 45, '2024-01-20', 'completed', 3, 2),
(1, '答辩状.pdf', '答辩状', '/files/case1/vol1/004_答辩状.pdf', 512000, 80, '2024-01-21', 'completed', 4, 2),
(2, '庭审记录.pdf', '庭审记录', '/files/case1/vol2/001_庭审记录.pdf', 768000, 1, '2024-02-15', 'completed', 5, 2),
(2, '代理意见.pdf', '代理意见', '/files/case1/vol2/002_代理意见.pdf', 384000, 30, '2024-02-16', 'completed', 6, 2),
(2, '裁决书.pdf', '裁决书', '/files/case1/vol2/003_裁决书.pdf', 640000, 55, '2024-03-01', 'completed', 7, 2),
(3, '合议庭评议记录.pdf', '内部材料', '/files/case1/vol3/001_合议庭评议记录.pdf', 256000, 1, '2024-02-28', 'completed', 8, 2),
(4, '劳动仲裁申请书.pdf', '申请书', '/files/case2/vol1/001_劳动仲裁申请书.pdf', 128000, 1, '2024-02-25', 'completed', 9, 2),
(5, '涉密合同.pdf', '合同', '/files/case3/vol1/001_涉密合同.pdf', 896000, 1, '2024-03-15', 'completed', 10, 2),
(7, '股权转让协议.pdf', '合同', '/files/case4/vol1/001_股权转让协议.pdf', 1152000, 1, '2024-04-10', 'processing', NULL, 2);

-- 插入OCR版本测试数据
INSERT INTO ocr_versions (document_id, version_number, ocr_text, ocr_engine, confidence_score, is_incremental, processed_by) VALUES
(1, 1, '仲裁申请书\n\n申请人：A科技有限公司，住所地：北京市朝阳区XXX路XXX号。\n法定代表人：王五，职务：总经理。\n联系电话：13800138001，身份证号：110101198001011234。\n\n被申请人：B贸易有限公司，住所地：上海市浦东新区XXX路XXX号。\n法定代表人：赵六，职务：董事长。\n联系电话：13900139002，身份证号：310101197505056789。\n\n仲裁请求：\n1. 裁决被申请人支付货款人民币4,500,000元；\n2. 裁决被申请人支付违约金人民币500,000元；\n3. 本案仲裁费用由被申请人承担。\n\n事实与理由：\n申请人与被申请人于2023年6月15日签订《货物买卖合同》，合同编号：HT20230615001。合同约定申请人向被申请人提供电子设备一批，总价款人民币4,500,000元。申请人已于2023年8月10日按约定交付全部货物，但被申请人至今未支付任何货款。经申请人多次催告，被申请人仍拒不履行付款义务。为维护申请人合法权益，特向贵委申请仲裁，请依法裁决。', 'Tesseract', 95.50, 0, 2),
(2, 1, '证据材料一\n\n证据1：《货物买卖合同》（合同编号：HT20230615001）\n签订日期：2023年6月15日\n甲方：A科技有限公司（盖章）\n乙方：B贸易有限公司（盖章）\n...', 'Tesseract', 94.20, 0, 2),
(3, 1, '证据材料二\n\n证据2：货物签收单\n签收日期：2023年8月10日\n签收人：李四（被授权人，身份证号：110101198505051111）\n联系电话：13700137003\n货物清单：\n1. 服务器10台，单价350,000元\n2. 交换机20台，单价50,000元\n合计：4,500,000元\n...', 'Tesseract', 93.80, 0, 2),
(4, 1, '答辩状\n\n答辩人：B贸易有限公司\n地址：上海市浦东新区XXX路XXX号\n法定代表人：赵六，电话：13900139002\n\n被答辩人：A科技有限公司\n\n答辩请求：\n1. 驳回被答辩人全部仲裁请求；\n2. 本案仲裁费用由被答辩人承担。\n\n事实与理由：\n被答辩人提供的货物存在严重质量问题，不符合合同约定标准。答辩人有权行使先履行抗辩权，拒绝支付货款。', 'Tesseract', 96.10, 0, 2),
(5, 1, '庭审记录\n\n时间：2024年2月15日 9:00-12:00\n地点：仲裁庭第一法庭\n仲裁员：孙七、周八、吴九\n书记员：郑十\n\n申请人出庭人员：王五（法定代表人）、陈律师（代理律师，执业证号：11101201010123456）\n被申请人出庭人员：赵六（法定代表人）、刘律师（代理律师，执业证号：310101201510654321）\n\n庭审过程：\n...', 'Tesseract', 92.50, 0, 2),
(6, 1, '代理意见\n\n尊敬的仲裁庭：\n\n北京XX律师事务所接受A科技有限公司委托，指派本律师担任其与B贸易有限公司买卖合同纠纷一案的仲裁代理人。现结合本案事实和法律，发表如下代理意见：\n...', 'Tesseract', 95.00, 0, 2),
(7, 1, '裁决书\n\n(2024)仲字第001号\n\n申请人：A科技有限公司\n被申请人：B贸易有限公司\n\n仲裁庭根据申请人与被申请人签订的《货物买卖合同》中的仲裁条款，以及申请人提交的仲裁申请，于2024年1月20日受理本案。\n...\n裁决如下：\n1. 被申请人B贸易有限公司向申请人A科技有限公司支付货款4,500,000元；\n2. 被申请人B贸易有限公司向申请人A科技有限公司支付违约金500,000元；\n3. 本案仲裁费50,000元，由被申请人承担。', 'Tesseract', 97.00, 0, 2),
(8, 1, '合议庭评议记录\n\n时间：2024年2月28日 14:00\n地点：仲裁委会议室\n参加人员：首席仲裁员孙七、仲裁员周八、仲裁员吴九\n记录人：郑十\n\n评议内容：\n...', 'Tesseract', 90.00, 0, 2),
(9, 1, '劳动仲裁申请书\n\n申请人：张三，男，1990年3月15日生，汉族，身份证号：110101199003155555\n住址：北京市海淀区XXX小区XXX号楼XXX单元XXX室\n联系电话：13600136006\n\n被申请人：李四（个体工商户）\n经营场所：北京市丰台区XXX市场XXX号\n...', 'Tesseract', 94.00, 0, 2),
(10, 1, '涉密合同\n\n合同编号：SM-HT2024001\n\n甲方：某涉密单位\n乙方：C建设工程有限公司\n\n鉴于甲方需要建设涉密工程项目，乙方具备相应资质，双方经友好协商，达成如下协议：\n\n甲方联系人：钱保密，电话：13500135005，身份证号：110101197808088888\n...', 'Tesseract', 93.50, 0, 2);

-- 插入脱敏版本测试数据
INSERT INTO desensitized_versions (ocr_version_id, desensitized_text, desensitization_rules, desensitized_count, processed_by) VALUES
(1, '仲裁申请书\n\n申请人：A科技有限公司，住所地：北京市朝阳区XXX路XXX号。\n法定代表人：王*，职务：总经理。\n联系电话：138****8001，身份证号：110101********1234。\n\n被申请人：B贸易有限公司，住所地：上海市浦东新区XXX路XXX号。\n法定代表人：赵*，职务：董事长。\n联系电话：139****9002，身份证号：310101********6789。\n\n仲裁请求：\n1. 裁决被申请人支付货款人民币4,500,000元；\n2. 裁决被申请人支付违约金人民币500,000元；\n3. 本案仲裁费用由被申请人承担。\n\n事实与理由：\n申请人与被申请人于2023年6月15日签订《货物买卖合同》，合同编号：HT20230615001。合同约定申请人向被申请人提供电子设备一批，总价款人民币4,500,000元。申请人已于2023年8月10日按约定交付全部货物，但被申请人至今未支付任何货款。经申请人多次催告，被申请人仍拒不履行付款义务。为维护申请人合法权益，特向贵委申请仲裁，请依法裁决。', '{"name": true, "idCard": true, "phone": true, "email": false, "address": false}', 6, 2),
(3, '证据材料二\n\n证据2：货物签收单\n签收日期：2023年8月10日\n签收人：李*（被授权人，身份证号：110101********1111）\n联系电话：137****7003\n货物清单：\n1. 服务器10台，单价350,000元\n2. 交换机20台，单价50,000元\n合计：4,500,000元\n...', '{"name": true, "idCard": true, "phone": true, "email": false, "address": false}', 3, 2),
(9, '劳动仲裁申请书\n\n申请人：张*，男，1990年3月15日生，汉族，身份证号：110101********5555\n住址：北京市海淀区XXX小区XXX号楼XXX单元XXX室\n联系电话：136****6006\n\n被申请人：李*（个体工商户）\n经营场所：北京市丰台区XXX市场XXX号\n...', '{"name": true, "idCard": true, "phone": true, "email": false, "address": false}', 4, 2),
(10, '涉密合同\n\n合同编号：SM-HT2024001\n\n甲方：某涉密单位\n乙方：C建设工程有限公司\n\n鉴于甲方需要建设涉密工程项目，乙方具备相应资质，双方经友好协商，达成如下协议：\n\n甲方联系人：钱*，电话：135****5005，身份证号：110101********8888\n...', '{"name": true, "idCard": true, "phone": true, "email": false, "address": false}', 3, 2);

-- 插入借阅记录测试数据
INSERT INTO borrow_records (document_id, applicant_id, approver_id, borrow_reason, borrow_type, status, borrow_date, due_date, return_date, created_at) VALUES
(1, 3, 2, '案件研究需要', 'view', 'returned', '2024-04-01', '2024-04-10', '2024-04-08', '2024-04-01 10:00:00'),
(2, 3, 2, '证据核查', 'view', 'approved', '2024-06-01', '2024-06-15', NULL, '2024-06-01 14:30:00'),
(5, 4, NULL, '撰写案例分析报告', 'view', 'pending', NULL, NULL, NULL, '2024-06-10 09:15:00'),
(10, 4, 2, '项目调研参考', 'export', 'approved', '2024-06-05', '2024-06-20', NULL, '2024-06-05 11:00:00'),
(7, 3, 2, '学习裁决文书写作', 'view', 'overdue', '2024-05-20', '2024-06-03', NULL, '2024-05-20 16:45:00');

-- 插入标注测试数据
INSERT INTO annotations (document_id, ocr_version_id, annotator_id, annotation_type, content, page_position, version) VALUES
(1, 1, 3, 'highlight', '注意合同签订日期', '{"page": 1, "x": 100, "y": 200, "width": 200, "height": 30}', 1),
(1, 1, 4, 'comment', '此处违约金计算标准需核实', '{"page": 3, "x": 150, "y": 300, "width": 250, "height": 40}', 1),
(7, 7, 4, 'bookmark', '重要裁决依据', '{"page": 5, "x": 50, "y": 150, "width": 100, "height": 20}', 1);
