import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import {
  assertIsBroadcastTxSuccess,
  codec,
  SigningStargateClient,
  StargateClient,
} from "@cosmjs/stargate";
import { stringToPath } from "@cosmjs/crypto";

export const sendPost = ()=>{
    const mnemonic =
    "surround miss nominee dream gap cross assault thank captain prosper drop duty group candy wealth weather scale put";
    const wallet =  DirectSecp256k1HdWallet.fromMnemonic(
        mnemonic,
        stringToPath("m/44'/852'/0'/0/0"),
        "blub"
    );
    
    const firstAccount = wallet.getAccounts();

    const rpcEndpoint = "http://localhost:26657/";
    const client = SigningStargateClient.connectWithSigner(
    rpcEndpoint,
    wallet
    /* { registry: registry } */
    );

    /* const msg = MsgDelegate.create({
    delegatorAddress: alice.address0,
    validatorAddress: validator.validatorAddress,
    amount: {
        denom: "uatom",
        amount: "1234567",
    },
    }); */
    /* {"body":{"messages":[
        {"@type":"/desmos.posts.v1beta1.MsgCreatePost",
        "parent_id":"",
        "message":"Hello",
        "allows_comments":true,
        "subspace":"4e188d9c17150037d5199bbdb91ae1eb2a78a15aca04cb35530cccb81494b36e",
        "optional_data":[],"creator":"desmos1ygzne2z3l05a4l50ch33tqwwfusssr4fmhjp58",
        "attachments":[],"poll_data":null}]
    */
        const msg={"parent_id":"",
        "message":"From React!",
        "allows_comments":true,
        "subspace":"4e188d9c17150037d5199bbdb91ae1eb2a78a15aca04cb35530cccb81494b36e",
        "optional_data":[],"creator":firstAccount.address,
        "attachments":[],"poll_data":null}

    const msgAny = {
    typeUrl: "/desmos.posts.v1beta1.MsgCreatePost",
    value: msg,
    };

    const fee = {
    amount: [
        {
        denom: "udaric",
        amount: "2000",
        },
    ],
    gas: "180000", // 180k
    };
    const memo = "Use your power wisely";
    const result = client.signAndBroadcast(
    firstAccount.address,
    [msgAny],
    fee,
    memo
    );

    assertIsBroadcastTxSuccess(result);
    console.log(result)

}

