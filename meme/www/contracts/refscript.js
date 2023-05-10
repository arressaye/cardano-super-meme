export const refContract = (memePolicy, token_name) => {
  return `
  spending meme_ref_holder

import { Datum, ExtraMetadata, getDatum } from meme_helpers

const LABEL100 = #000643b0
const LABEL333 = #0014df10
const memePolicy: MintingPolicyHash = MintingPolicyHash::new(#${memePolicy})
const tokenName = #${token_name}

enum Redeemer {
    UPDATE
    WITHDRAW
}

func main(_, r: Redeemer, ctx: ScriptContext) -> Bool {
    refTokenInputs: []TxInput = ctx.tx.inputs.filter((input: TxInput) -> Bool {
        input.output.value.get_safe(
            AssetClass::new(
                memePolicy,
                LABEL100 + tokenName
            )
        ) == 1
    });
    refTokenUtxoDatum: OutputDatum = refTokenInputs.get_singleton().output.datum;
    refTokenDatum: Datum::DATUM = refTokenUtxoDatum.switch {
        inline: Inline => getDatum(inline),
        _ => error("Expected inline datum")
    };
    mintedQuantity: Int = refTokenDatum.extras.minted_quantity;

    ctx.tx.minted.get_policy(memePolicy).length > 0
    &&
    r.switch {
        UPDATE => {
            ctx.get_current_input().output.value.get_assets() != Value::ZERO
            &&
            ctx.get_current_input().output.value.get_assets() == ctx.tx.value_locked_by(ctx.get_current_validator_hash()).get_assets()
        },
        WITHDRAW => {
            burnQuantity: Int = ctx.tx.minted.get_safe(
                AssetClass::new(
                    memePolicy,
                    LABEL333 + tokenName
                )
            );
            ctx.get_current_input().output.value.get_assets() == Value::ZERO
            &&
            ctx.get_current_input().output.ref_script_hash.switch {
              None => true,
              _ => false
            }
            &&
            burnQuantity < 0
            &&
            (burnQuantity.abs() / 9 * 10) >= mintedQuantity / 20
        }
    }
}
  `;
};
