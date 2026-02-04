const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, BorderStyle, WidthType,
        PageNumber, LevelFormat, ShadingType, VerticalAlign } = require('docx');
const fs = require('fs');

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "SimSun", size: 24 }
      }
    },
    paragraphStyles: [
      {
        id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 44, bold: true, font: "SimHei" },
        paragraph: { spacing: { before: 400, after: 400 }, alignment: AlignmentType.CENTER }
      },
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "SimHei" },
        paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "ContractBody", name: "Contract Body", basedOn: "Normal",
        run: { size: 24, font: "SimSun" },
        paragraph: { spacing: { after: 120, line: 360 }, indent: { firstLine: 480 } }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "youlidao.ai AI软件开发平台服务合同", size: 18, color: "888888", font: "SimHei" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "第 ", size: 20 }),
            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
            new TextRun({ text: " 页 / 共 ", size: 20 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 }),
            new TextRun({ text: " 页", size: 20 })
          ]
        })]
      })
    },
    children: [
      // 标题
      new Paragraph({
        style: "Title",
        children: [new TextRun("youlidao.ai AI软件开发平台")]
      }),
      new Paragraph({
        style: "Title",
        spacing: { before: 0 },
        children: [new TextRun("服务合同")]
      }),

      // 合同编号
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 400, after: 400 },
        children: [new TextRun({ text: "合同编号：____________________", size: 22 })]
      }),

      // 甲方信息
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        children: [
          new TextRun({ text: "甲方（服务提供方）：", bold: true }),
          new TextRun("____________________________________")
        ]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        children: [new TextRun("统一社会信用代码：____________________________________")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        children: [new TextRun("注册地址：____________________________________")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        children: [new TextRun("联系人：__________________  联系电话：__________________")]
      }),

      // 乙方信息
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        spacing: { before: 300 },
        children: [
          new TextRun({ text: "乙方（服务接收方）：", bold: true }),
          new TextRun("____________________________________")
        ]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        children: [new TextRun("统一社会信用代码：____________________________________")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        children: [new TextRun("注册地址：____________________________________")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        children: [new TextRun("联系人：__________________  联系电话：__________________")]
      }),

      // 前言
      new Paragraph({
        style: "ContractBody",
        spacing: { before: 400 },
        children: [new TextRun('鉴于甲方拥有自主知识产权的 youlidao.ai AI软件开发平台（以下简称"平台"或"系统"），该平台基于 Orchestrix 框架构建，可协调专业 AI Agent 完成软件项目开发工作。乙方希望使用该平台进行软件项目开发。经双方友好协商，本着平等互利的原则，就甲方向乙方提供平台服务事宜达成如下协议：')]
      }),

      // 第一条 服务内容与范围
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第一条 服务内容与范围")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "1.1 平台使用授权", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("甲方授权乙方在合同有效期内使用 youlidao.ai AI软件开发平台，包括但不限于：平台图形化界面、AI Agent 协调系统、工作流管理功能、项目文档生成功能等核心模块。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "1.2 POD 基础设施实施", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("甲方负责为乙方搭建专属的 POD（Private On-Demand）运行环境，包括：系统部署与配置、账户初始化、基础测试验证等实施工作。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "1.3 月度订阅服务", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("POD 实施完成后，甲方持续向乙方提供以下月度订阅服务：")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(1) AI Agent 工作时长额度（具体额度见第五条）；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(2) 系统运维与技术支持服务；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(3) 系统升级与功能更新；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(4) 使用培训与技术咨询。")]
      }),

      // 第二条 知识产权
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第二条 知识产权")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "2.1 平台知识产权", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("youlidao.ai 平台、Orchestrix 框架及其所有组件（包括但不限于源代码、架构设计、AI Agent 定义、工作流模板、技术文档等）的知识产权归甲方所有。乙方仅获得合同期内的使用权，不得复制、修改、反编译、出售或以任何方式转让平台及其组件。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "2.2 项目产出归属", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("乙方使用平台进行项目开发所产生的全部成果，包括但不限于：源代码、技术文档、设计文件、测试用例等，其知识产权归乙方所有。甲方不对乙方的项目产出主张任何权利。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "2.3 数据归属", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("乙方在使用平台过程中输入、生成、存储的所有业务数据归乙方所有。合同终止后，甲方应配合乙方完成数据迁移，并在确认迁移完成后删除乙方的业务数据。")]
      }),

      // 第三条 保密条款
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第三条 保密条款")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "3.1 保密信息定义", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同所称保密信息包括但不限于：")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(1) 甲方：平台技术架构、源代码、算法、商业计划、定价策略等；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(2) 乙方：业务数据、项目内容、商业秘密、客户信息等；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(3) 双方：本合同条款、价格信息、合作细节等。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "3.2 保密义务", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("双方应对获知的对方保密信息承担保密义务，未经信息提供方书面同意，不得向任何第三方披露、泄露或允许第三方使用该等保密信息。保密义务在合同终止后继续有效，有效期为合同终止之日起三（3）年。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "3.3 例外情形", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("以下情形不视为违反保密义务：(1) 信息接收时已为公众所知；(2) 非因接收方过错而成为公众所知；(3) 接收方从有权披露的第三方合法获得；(4) 依法律法规或政府机关要求必须披露（但应事先通知对方）。")]
      }),

      // 第四条 数据安全
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第四条 数据安全")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "4.1 数据保护措施", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("甲方应采取合理的技术和管理措施保护乙方数据安全，包括但不限于：数据加密传输与存储、访问权限控制、安全审计日志、定期安全评估等。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "4.2 数据处理规范", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("甲方仅在提供本合同约定服务所必需的范围内处理乙方数据，不得将乙方数据用于其他目的。未经乙方书面授权，甲方不得将乙方数据转移至中华人民共和国境外。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "4.3 数据安全事件", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("如发生数据泄露、丢失或其他安全事件，甲方应在发现后二十四（24）小时内通知乙方，并立即采取补救措施。甲方应配合乙方进行事件调查，并承担因甲方原因导致的安全事件所产生的法律责任。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "4.4 合规要求", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("双方应遵守《中华人民共和国网络安全法》《中华人民共和国数据安全法》《中华人民共和国个人信息保护法》等相关法律法规的规定。")]
      }),

      // 第五条 费用与支付
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第五条 费用与支付")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "5.1 费用明细", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "（一）POD 基础设施实施费（一次性）", bold: true })]
      }),

      // POD实施费表格
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),
      new Table({
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "项目", bold: true })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "费用（人民币）", bold: true })]
                })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("POD 环境部署与配置")]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("¥10,000 元")]
                })]
              })
            ]
          })
        ]
      }),

      new Paragraph({
        style: "ContractBody",
        spacing: { before: 300 },
        children: [new TextRun({ text: "（二）月度订阅服务费", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun('乙方可根据实际需求选择以下套餐之一（请在所选套餐前"□"内打"✓"）：')]
      }),

      // 套餐表格
      new Paragraph({ spacing: { before: 200, after: 200 }, children: [] }),
      new Table({
        columnWidths: [1200, 2400, 3000, 2760],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "选择", bold: true })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "套餐名称", bold: true })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "AI Agent 工作时长", bold: true })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                shading: { fill: "E8E8E8", type: ShadingType.CLEAR },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "月费（人民币）", bold: true })]
                })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("□")]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("基础版")]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("180 小时/月")]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("¥1,500 元/月")]
                })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("□")]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("专业版")]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("600 小时/月")]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun("¥3,000 元/月")]
                })]
              })
            ]
          })
        ]
      }),

      new Paragraph({
        style: "ContractBody",
        spacing: { before: 200 },
        children: [new TextRun({ text: "说明：", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(1) AI Agent 工作时长指平台内所有 AI Agent 实际处理任务的累计时间总和；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(2) 单个会话（Session）内可能有多个 Agent 并行工作，各 Agent 的工作时长分别计算并累加；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(3) 乙方可同时开启多个会话，所有会话内的 Agent 工作时长均计入当月总用量；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(4) 当月未使用完的时长不予累积至下月；")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { left: 480, firstLine: 0 },
        children: [new TextRun("(5) 如当月时长用尽，乙方可联系甲方购买额外时长包，额外时长包价格另行约定。")]
      }),

      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "5.2 支付方式", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("(1) POD 实施费：乙方应在合同签订后五（5）个工作日内支付全额实施费用人民币壹万元整（¥10,000）；")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("(2) 月度订阅费：乙方应在每月____日前支付当月订阅费用。首月费用应与 POD 实施费一并支付。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "5.3 发票开具", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("甲方应在收到乙方付款后十（10）个工作日内向乙方开具合法有效的增值税发票。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "5.4 逾期付款", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("如乙方逾期支付费用，甲方有权按日收取逾期金额万分之三的滞纳金。逾期超过三十（30）日的，甲方有权暂停服务直至乙方付清全部欠款及滞纳金。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "5.5 套餐变更", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("乙方如需变更套餐，应提前十五（15）日书面通知甲方，新套餐自下一个计费周期起生效。升级套餐时差价即时补足，降级套餐时已付费用不予退还。")]
      }),

      // 第六条 服务期限
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第六条 服务期限")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "6.1 合同期限", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同自双方签字盖章之日起生效，有效期为____年，至____年____月____日届满。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "6.2 续约", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("合同期满前三十（30）日内，如双方均未提出终止合同的书面通知，则本合同自动续期一（1）年，续期次数不限。续期期间的服务费用另行协商确定。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "6.3 提前终止", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("任何一方如需提前终止合同，应提前六十（60）日书面通知对方。提前终止的，已支付的 POD 实施费不予退还，月度订阅费按实际服务天数结算。")]
      }),

      // 第七条 违约责任
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第七条 违约责任")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "7.1 甲方违约", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("如因甲方原因导致服务中断超过连续二十四（24）小时的，甲方应按日向乙方支付月度订阅费的百分之五（5%）作为违约金，但违约金总额不超过当月订阅费的百分之三十（30%）。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "7.2 乙方违约", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("如乙方违反本合同约定，擅自复制、修改、反编译平台或将平台转让给第三方的，甲方有权立即终止服务，已收费用不予退还，并有权要求乙方赔偿由此造成的一切损失。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "7.3 保密违约", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("任何一方违反保密条款的，违约方应向守约方支付违约金人民币____万元，如实际损失超过违约金的，违约方还应赔偿超出部分的损失。")]
      }),

      // 第八条 免责条款
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第八条 免责条款")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "8.1 不可抗力", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("因不可抗力（包括但不限于自然灾害、战争、政府行为、法律法规变更等）导致本合同无法履行的，受影响方不承担违约责任，但应及时通知对方并提供证明。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "8.2 第三方服务", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("因第三方AI服务提供商（如 Anthropic、OpenAI 等）的服务中断、API 变更、价格调整等原因导致的服务影响，甲方不承担违约责任，但应及时通知乙方并协助处理。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "8.3 责任限制", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("除故意或重大过失外，甲方对乙方的赔偿责任上限为乙方在违约事件发生前十二（12）个月内向甲方支付的服务费用总额。")]
      }),

      // 第九条 争议解决
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第九条 争议解决")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "9.1 协商解决", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同履行过程中发生的争议，双方应首先通过友好协商解决。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "9.2 仲裁", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("协商不成的，任何一方均可将争议提交____仲裁委员会，按照申请仲裁时该会现行有效的仲裁规则进行仲裁。仲裁裁决是终局的，对双方均有约束力。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "9.3 法律适用", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同的订立、效力、解释、履行及争议解决均适用中华人民共和国法律（不包括港澳台地区法律）。")]
      }),

      // 第十条 其他条款
      new Paragraph({
        style: "Heading1",
        spacing: { before: 400 },
        children: [new TextRun("第十条 其他条款")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "10.1 通知", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同项下的通知应以书面形式（包括电子邮件）发送至本合同首部载明的联系方式。任何一方变更联系方式的，应提前五（5）个工作日书面通知对方。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "10.2 完整协议", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同构成双方就本合同标的达成的完整协议，取代此前双方就同一事项达成的任何口头或书面协议。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "10.3 修改", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同的任何修改或补充须经双方授权代表签字盖章后生效。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "10.4 可分割性", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同任何条款如被认定为无效或不可执行，不影响其他条款的效力。双方应以最接近原意的有效条款替代无效条款。")]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun({ text: "10.5 文本", bold: true })]
      }),
      new Paragraph({
        style: "ContractBody",
        children: [new TextRun("本合同一式两份，甲乙双方各执一份，具有同等法律效力。")]
      }),

      // 签署页
      new Paragraph({
        style: "Heading1",
        spacing: { before: 600 },
        children: [new TextRun("签署页")]
      }),
      new Paragraph({
        style: "ContractBody",
        indent: { firstLine: 0 },
        children: [new TextRun("（本页无正文，为签署页）")]
      }),

      // 签署表格
      new Paragraph({ spacing: { before: 400 }, children: [] }),
      new Table({
        columnWidths: [4680, 4680],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } },
                width: { size: 4680, type: WidthType.DXA },
                children: [
                  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "甲方（盖章）：", bold: true })] }),
                  new Paragraph({ spacing: { after: 400 }, children: [] }),
                  new Paragraph({ spacing: { after: 200 }, children: [new TextRun("法定代表人/授权代表（签字）：")] }),
                  new Paragraph({ spacing: { after: 400 }, children: [] }),
                  new Paragraph({ children: [new TextRun("日期：____年____月____日")] })
                ]
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } },
                width: { size: 4680, type: WidthType.DXA },
                children: [
                  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "乙方（盖章）：", bold: true })] }),
                  new Paragraph({ spacing: { after: 400 }, children: [] }),
                  new Paragraph({ spacing: { after: 200 }, children: [new TextRun("法定代表人/授权代表（签字）：")] }),
                  new Paragraph({ spacing: { after: 400 }, children: [] }),
                  new Paragraph({ children: [new TextRun("日期：____年____月____日")] })
                ]
              })
            ]
          })
        ]
      })
    ]
  }]
});

// 生成文件
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/Users/dorayo/Codes/Orchestrix/workspace/youlidao-ai-服务合同.docx', buffer);
  console.log('合同文档已生成: youlidao-ai-服务合同.docx');
});
