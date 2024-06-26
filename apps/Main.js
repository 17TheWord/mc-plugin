import plugin from '../../../lib/plugins/plugin.js'
import RconClient from '../components/Rcon.js'
import Config from '../components/Config.js'

export class Main extends plugin {
  constructor() {
    super({
      /** 功能名称 */
      name: 'MC_QQ-同步',
      /** 功能描述 */
      dsc: '同步消息',
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 1009,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '',
          /** 执行方法 */
          fnc: 'sync',
          /** 关闭日志 */
          log: false
        }
      ]
    })
  }

  async sync(e) {
    if (!e.group_id) return false
    const { mc_qq_send_group_name, mc_qq_server_list, debug_mode } = await Config.getConfig();
    const { servers } = RconClient
    if (!Object.keys(servers).length) return false

    const serversList = mc_qq_server_list
      .filter(server => server.rcon_able && server.group_list.some(group => group == e.group_id));

    if (!serversList.length) return false

    serversList
      .map(({ server_name }) => servers[server_name])
      .filter(server => server !== undefined)
      .forEach(async (server, i) => {
        if (e.raw_message.startsWith(serversList[i].command_header) && (serversList[i].command_user?.some(user => user == e.user_id) || e.isMaster)) {
          let response = await server.send(`${e.raw_message.replace(serversList[i].command_header, '')}`);
          await e.reply(response);
        } else {
          let msg = mc_qq_send_group_name ? `[${e.group_name}] ` : "";
          msg += `[${e.sender.nickname}] ${e.raw_message}`
          server.send(`/say ${msg}`);
          if (debug_mode) {
            logger.mark(
              logger.blue('[Minecraft RCON Client] ') + '向 ' +
              logger.green(serversList[i].server_name) +
              ' 发送消息 ' + msg
            )
          }
        }
      })

    return false
  }
}