import { util, extensions } from "@aws-appsync/utils"

export function request() { return { payload: null } }


export function response(ctx) {
    const filter = {
        chatSessionId: {
            beginsWith: ctx.args.chatSessionId
        }
    }

    extensions.setSubscriptionFilter(util.transform.toSubscriptionFilter(filter))

    return null
}