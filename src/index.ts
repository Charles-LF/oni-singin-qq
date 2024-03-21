import { Context, Schema, Random, Time } from "koishi";

declare module "koishi" {
  interface Tables {
    signin_oni: Idb;
  }
}

export const name = "oni-singin-qq";

export const usage = `
QQ群用的签到打卡,用来学习数据库的使用,仅限QQ群使用,需要有md权限.

更新日志: 
  - 0.0.2 添加查wiki的按钮
  - 0.0.1 完成主逻辑
`;

export const inject = ["database"];

export interface Config {
  maxImg: number;
  maxGold: number;
  mdId: string;
  imgUrl: string;
}

export const Config: Schema<Config> = Schema.object({
  maxGold: Schema.number().default(10).description("单次的签到的最大金币数"),
  maxImg: Schema.number().default(10).description("签到的可以获取最大图片数"),
  mdId: Schema.string().description("模板ID"),
  imgUrl: Schema.string().description("模板图片URL"),
});

// 定义数据库
interface Idb {
  id: string;
  name: string;
  nowGold: number;
  allGold: number;

  time: string;
  allDay: number;
  imgNum: number;
}

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger(name);
  ctx.on("message", (session) => {
    if (
      session.content === `<at id="16194082000446472680"/> 来一张托德女装照片`
    ) {
      session.send(`来咯,${encodeURI("https://klei.vip:250/托德女装.jpeg")}`);
    }
  });
  ctx.model.extend(
    "signin_oni",
    {
      id: "string",
      name: "string",
      nowGold: "integer",
      allGold: "integer",
      time: "string",
      imgNum: "integer",
      allDay: "integer",
    },
    {
      unique: ["id"],
    }
  );

  // 注册指令
  ctx
    .command("singin", "签到打卡")
    .alias("打卡")
    .action(async ({ session }) => {
      logger.info(session.content);

      // 签到配置
      let oneGold = Random.int(1, config.maxGold);
      let signin_Time = Time.template("yyyy-MM-dd hh:mm:ss", new Date());
      let imgNum = Random.int(1, config.maxImg);

      let userProfile = await ctx.database.get("signin_oni", {
        id: session.userId,
      });
      // 数据库没有
      if (userProfile.length == 0) {
        logger.info(`用户${session.username}第一次签到,即将写入数据库...`);

        await ctx.database.create("signin_oni", {
          id: session.userId,
          name: session.username,
          nowGold: oneGold,
          allGold: oneGold,
          time: signin_Time,
          imgNum: imgNum,
          allDay: 1,
        });
        await session.bot.internal.sendMessage(session.guildId, {
          content: "111",
          msg_type: 2,
          markdown: {
            custom_template_id: config.mdId,
            params: [
              {
                key: "text1",
                values: [`![text #460px #215px]`],
              },
              {
                key: "text2",
                values: [`(${config.imgUrl + imgNum}.jpg)`],
              },
              {
                key: "text3",
                values: [`.`],
              },
              {
                key: "text4",
                values: [
                  `<@${session.userId}> 冒泡成功思密达,今天,也要多喝热水哟...`,
                ],
              },
              {
                key: "text5",
                values: [` 📆  累计冒泡:  1 天`],
              },
              {
                key: "text6",
                values: [` 🎫  本次获得金币: ${oneGold} 枚`],
              },
              {
                key: "text7",
                values: [` 🏛️  库存金币剩余: ${oneGold} 枚`],
              },
              {
                key: "text8",
                values: [`>知识才是一个人类最虔诚的信仰`],
              },
            ],
          },
          keyboard: {
            content: {
              rows: [
                {
                  buttons: [
                    {
                      id: "1",
                      render_data: {
                        label: "我也要签到",
                        visited_label: "我也要签到",
                      },
                      action: {
                        type: 2,
                        permission: {
                          type: 2,
                        },
                        unsupport_tips: "兼容文本",
                        data: "打卡",
                        enter: true,
                      },
                    },
                    {
                      id: "2",
                      render_data: {
                        label: "来一张托德女装",
                        visited_label: "我也要签到",
                      },
                      action: {
                        type: 2,
                        permission: {
                          type: 2,
                        },
                        unsupport_tips: "兼容文本",
                        data: "来一张托德女装照片",
                        enter: true,
                      },
                    },
                  ],
                },
                {
                  buttons: [
                    {
                      id: "1",
                      render_data: {
                        label: "这是什么? wiki! 查一下",
                        visited_label: "这是什么? wiki! 查一下",
                      },
                      action: {
                        type: 2,
                        permission: {
                          type: 2,
                        },
                        unsupport_tips: "兼容文本",
                        data: "/查wiki",
                        enter: false,
                      },
                    },
                  ],
                },
              ],
            },
          },
          msg_id: session.messageId,
          timestamp: session.timestamp,
          msg_seq: Math.floor(Math.random() * 500),
        });
      } else {
        //时间不一样,给签
        if (userProfile[0].time.slice(8, 10) != signin_Time.slice(8, 10)) {
          await ctx.database.upsert("signin_oni", [
            {
              id: session.userId,
              name: session.username,
              nowGold: oneGold,
              allGold: userProfile[0].allGold + oneGold,
              time: signin_Time,
              imgNum: imgNum,
              allDay: userProfile[0].allDay + 1,
            },
          ]);
          await session.bot.internal.sendMessage(session.guildId, {
            content: "111",
            msg_type: 2,
            markdown: {
              custom_template_id: config.mdId,
              params: [
                {
                  key: "text1",
                  values: [`![text #460px #215px]`],
                },
                {
                  key: "text2",
                  values: [`(${config.imgUrl + imgNum}.jpg)`],
                },
                {
                  key: "text3",
                  values: [`.`],
                },
                {
                  key: "text4",
                  values: [
                    `<@${session.userId}> 冒泡成功思密达,今天,也要多喝热水哟...`,
                  ],
                },
                {
                  key: "text5",
                  values: [` 📆  累计冒泡:  ${userProfile[0].allDay + 1} 天`],
                },
                {
                  key: "text6",
                  values: [` 🎫  本次获得金币: ${oneGold} 枚`],
                },
                {
                  key: "text7",
                  values: [
                    ` 🏛️  库存金币剩余: ${userProfile[0].allGold + oneGold} 枚`,
                  ],
                },
                {
                  key: "text8",
                  values: [`>知识才是一个人类最虔诚的信仰`],
                },
              ],
            },
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      {
                        id: "1",
                        render_data: {
                          label: "我也要签到",
                          visited_label: "我也要签到",
                        },
                        action: {
                          type: 2,
                          permission: {
                            type: 2,
                          },
                          unsupport_tips: "兼容文本",
                          data: "打卡",
                          enter: true,
                        },
                      },
                      {
                        id: "2",
                        render_data: {
                          label: "来一张托德女装",
                          visited_label: "我也要签到",
                        },
                        action: {
                          type: 2,
                          permission: {
                            type: 2,
                          },
                          unsupport_tips: "兼容文本",
                          data: "来一张托德女装照片",
                          enter: true,
                        },
                      },
                    ],
                  },
                  {
                    buttons: [
                      {
                        id: "1",
                        render_data: {
                          label: "这是什么? wiki! 查一下",
                          visited_label: "这是什么? wiki! 查一下",
                        },
                        action: {
                          type: 2,
                          permission: {
                            type: 2,
                          },
                          unsupport_tips: "兼容文本",
                          data: "/查wiki",
                          enter: false,
                        },
                      },
                    ],
                  },
                ],
              },
            },
            msg_id: session.messageId,
            timestamp: session.timestamp,
            msg_seq: Math.floor(Math.random() * 500),
          });
        } else {
          // 今天已经签到过了
          await session.bot.internal.sendMessage(session.guildId, {
            content: "111",
            msg_type: 2,
            markdown: {
              custom_template_id: config.mdId,
              params: [
                {
                  key: "text1",
                  values: [`![text #460px #215px]`],
                },
                {
                  key: "text2",
                  values: [`(${config.imgUrl + userProfile[0].imgNum}.jpg)`],
                },
                {
                  key: "text3",
                  values: [`.`],
                },
                {
                  key: "text4",
                  values: [`<@${session.userId}> 今天已经签到过了哟...`],
                },
                {
                  key: "text5",
                  values: [` 📆  累计冒泡:  ${userProfile[0].allDay} 天`],
                },
                {
                  key: "text6",
                  values: [` 🎫  本次获得金币: ${userProfile[0].nowGold} 枚`],
                },
                {
                  key: "text7",
                  values: [` 🏛️  库存金币剩余: ${userProfile[0].allGold} 枚`],
                },
                {
                  key: "text8",
                  values: [`>知识才是一个人类最虔诚的信仰`],
                },
              ],
            },
            keyboard: {
              content: {
                rows: [
                  {
                    buttons: [
                      {
                        id: "1",
                        render_data: {
                          label: "我也要签到",
                          visited_label: "我也要签到",
                        },
                        action: {
                          type: 2,
                          permission: {
                            type: 2,
                          },
                          unsupport_tips: "兼容文本",
                          data: "打卡",
                          enter: true,
                        },
                      },
                      {
                        id: "2",
                        render_data: {
                          label: "来一张托德女装",
                          visited_label: "我也要签到",
                        },
                        action: {
                          type: 2,
                          permission: {
                            type: 2,
                          },
                          unsupport_tips: "兼容文本",
                          data: "来一张托德女装照片",
                          enter: true,
                        },
                      },
                    ],
                  },
                  {
                    buttons: [
                      {
                        id: "1",
                        render_data: {
                          label: "这是什么? wiki! 查一下",
                          visited_label: "这是什么? wiki! 查一下",
                        },
                        action: {
                          type: 2,
                          permission: {
                            type: 2,
                          },
                          unsupport_tips: "兼容文本",
                          data: "/查wiki",
                          enter: false,
                        },
                      },
                    ],
                  },
                ],
              },
            },
            msg_id: session.messageId,
            timestamp: session.timestamp,
            msg_seq: Math.floor(Math.random() * 500),
          });
        }
      }
    });
}
