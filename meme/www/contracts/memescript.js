export const memeContract = (token_name, utxo_hash, utxo_id) => {
  return `
minting meme_token

import { Datum, ExtraMetadata, getDatum } from meme_helpers

const LABEL100 = #000643b0
const LABEL333 = #0014df10
const tokenName = #${token_name}
const utxoHashToConsume = #${utxo_hash}
const utxoIdToConsume = ${utxo_id}

enum Redeemer {
    MINT
    BURN
}

func main(r: Redeemer, ctx: ScriptContext) -> Bool {
    tx: Tx = ctx.tx;
    thisPolicy: MintingPolicyHash = ctx.get_current_minting_policy_hash();
    refTokenInputs: []TxInput = tx.inputs.filter((input: TxInput) -> Bool {
        input.output.value.get_safe(
            AssetClass::new(
                thisPolicy,
                LABEL100 + tokenName
            )
        ) == 1
    });
    r.switch {
        MINT => {
            if (refTokenInputs.length == 0) {
                utxoToConsume = TxOutputId::new(TxId::new(utxoHashToConsume), utxoIdToConsume);
                tx.inputs.any((txinput: TxInput) -> Bool { txinput.output_id == utxoToConsume })
                &&
                tx.minted.get(
                    AssetClass::new(
                        thisPolicy,
                        LABEL333 + tokenName
                    )
                ) == 1000000
                &&
                tx.minted.get(
                    AssetClass::new(
                        thisPolicy,
                        LABEL100 + tokenName
                    )
                ) == 1
            } else {
                refTokenVH: ValidatorHash = refTokenInputs.get_singleton().output.address.credential.switch {
                    v: Validator => v.hash,
                    _ => error("Expected validator hash")
                };
                refTokenUtxoDatum: OutputDatum = refTokenInputs.get_singleton().output.datum;
                refTokenDatum: Datum::DATUM = refTokenUtxoDatum.switch {
                    inline: Inline => getDatum(inline),
                    _ => error("Expected inline datum")
                };
                lastMinterPkh: PubKeyHash = refTokenDatum.extras.last_minter_pkh;
                lastMinterSkh: StakeKeyHash = refTokenDatum.extras.last_minter_skh;
                maxQuantity: Int = refTokenDatum.extras.max_quantity;
                mintedQuantity: Int = refTokenDatum.extras.minted_quantity;
                mintQuantity: Int = tx.minted.get(
                    AssetClass::new(
                        thisPolicy,
                        LABEL333 + tokenName
                    )
                );
                thisMinterAddress: Address = tx.inputs.filter((input: TxInput) -> Bool {
                    input.output.address.credential.switch {
                        PubKey => true,
                        _ => false
                    }
                    &&
                    input.output.address.staking_credential.switch {
                        s: Some => s.some.switch {
                            h: Hash => h.hash.switch {
                                StakeKey => true,
                                _ => false
                            },
                            _ => false
                        },
                        _ => false
                    }
                }).head.output.address;
                thisMinterPkh: PubKeyHash = thisMinterAddress.credential.switch {
                    pk: PubKey => pk.hash,
                    _ => error("Expected public key")
                };
                thisMinterSkh: StakeKeyHash = thisMinterAddress.staking_credential.switch {
                    s: Some => s.some.switch {
                        h: Hash => h.hash.switch {
                            sk: StakeKey => sk.hash,
                            _ => error("Expected stake key hash")
                        },
                        _ => error("Expected stake key hash")
                    },
                    _ => error("Expected stake key hash")
                };
                expectedDatum: Datum::DATUM = Datum::DATUM {
                    metadata: refTokenDatum.metadata,
                    version: refTokenDatum.version,
                    extras: ExtraMetadata {
                        last_minter_pkh: thisMinterPkh,
                        last_minter_skh: thisMinterSkh,
                        max_quantity: maxQuantity,
                        minted_quantity: mintedQuantity + mintQuantity
                    }
                };
                mintQuantity % 1000000 == 0
                &&
                mintQuantity <= 10000000
                &&
                mintQuantity <= maxQuantity - mintedQuantity
                &&
                tx.minted.get_assets().to_map().get(thisPolicy).length == 1
                &&
                tx.outputs_locked_by_datum(refTokenVH, expectedDatum, true).head.value.get_safe(
                    AssetClass::new(
                        thisPolicy,
                        LABEL100 + tokenName
                    )
                ) == 1
                &&
                tx.outputs_locked_by(refTokenVH).any((output: TxOutput) -> Bool {
                    output.value == Value::lovelace(2000000 * mintQuantity / 1000000)
                })
                &&
                tx.outputs.any((output: TxOutput) -> Bool {
                    output.value.get_safe(
                        AssetClass::new(
                            thisPolicy,
                            LABEL333 + tokenName
                        )
                    ) == mintQuantity / 10 &&
                    output.address == Address::new(
                        Credential::new_pubkey(lastMinterPkh),
                        Option[StakingCredential]::Some{StakingCredential::new_hash(StakingHash::new_stakekey(lastMinterSkh))}
                    )
                })
            }
        },
        BURN => {
            refTokenVH: ValidatorHash = refTokenInputs.get_singleton().output.address.credential.switch {
                v: Validator => v.hash,
                _ => error("Expected validator hash")
            };
            refTokenUtxoDatum: OutputDatum = refTokenInputs.get_singleton().output.datum;
            refTokenDatum: Datum::DATUM = refTokenUtxoDatum.switch {
                inline: Inline => getDatum(inline),
                _ => error("Expected inline datum")
            };
            lastMinterPkh: PubKeyHash = refTokenDatum.extras.last_minter_pkh;
            lastMinterSkh: StakeKeyHash = refTokenDatum.extras.last_minter_skh;
            maxQuantity: Int = refTokenDatum.extras.max_quantity;
            mintedQuantity: Int = refTokenDatum.extras.minted_quantity;
            mintQuantity: Int = tx.minted.get(
                AssetClass::new(
                    thisPolicy,
                    LABEL333 + tokenName
                )
            );
            mintQuantityPos: Int = mintQuantity.abs();
            tax: Int = mintQuantityPos / 9;
            expectedDatum: Datum::DATUM = Datum::DATUM {
                metadata: refTokenDatum.metadata,
                version: refTokenDatum.version,
                extras: ExtraMetadata {
                    last_minter_pkh: lastMinterPkh,
                    last_minter_skh: lastMinterSkh,
                    max_quantity: maxQuantity,
                    minted_quantity: mintedQuantity + mintQuantity
                }
            };

            mintQuantityPos >= 9 
            && 
            tax >= 1 
            &&
            mintQuantity < 0
            &&
            tx.minted.get_assets().to_map().get(thisPolicy).length == 1
            &&
            tx.outputs_locked_by_datum(refTokenVH, expectedDatum, true).head.value.get_safe(
                AssetClass::new(
                    thisPolicy,
                    LABEL100 + tokenName
                )
            ) == 1
            &&
            tx.outputs.any((output: TxOutput) -> Bool {
                output.value.get_safe(
                    AssetClass::new(
                        thisPolicy,
                        LABEL333 + tokenName
                    )
                ) == tax &&
                output.address == Address::new(
                    Credential::new_pubkey(lastMinterPkh),
                    Option[StakingCredential]::Some{StakingCredential::new_hash(StakingHash::new_stakekey(lastMinterSkh))}
                )
            })
        }
    }
}
`;
};
