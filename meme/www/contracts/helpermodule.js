export const helperModule = () => {
  return `
    module meme_helpers

struct ExtraMetadata {
    last_minter_pkh: PubKeyHash
    last_minter_skh: StakeKeyHash
    max_quantity: Int
    minted_quantity: Int
}

enum Datum {
    DATUM {
        metadata: Map[String]String
        version: Int
        extras: ExtraMetadata
    }
}

func getDatum (outputDatum: OutputDatum) -> Datum::DATUM {
    outputDatum.switch {
        inline: Inline => {
            inline.data.switch {
                (Int, fields: []Data) => {
                    metadata: Map[String]String = Map[String]String::from_data(fields.get(0));
                    version: Int = Int::from_data(fields.get(1));
                    extras: ExtraMetadata =
                        if (fields.length > 2) {
                            fields.get(2).switch {
                                l: []Data => {
                                    ExtraMetadata {
                                        last_minter_pkh: PubKeyHash::from_data(l.get(0)),
                                        last_minter_skh: StakeKeyHash::from_data(l.get(1)),
                                        max_quantity: Int::from_data(l.get(2)),
                                        minted_quantity: Int::from_data(l.get(3))
                                    }
                                },
                                _ => error("Expected list")
                            }
                        } else {
                            ExtraMetadata {
                                last_minter_pkh: PubKeyHash::new(#),
                                last_minter_skh: StakeKeyHash::new(#),
                                max_quantity: 0,
                                minted_quantity: 0
                            }
                        };
                    Datum::DATUM {
                        metadata: metadata,
                        version: version,
                        extras: extras
                    }
                },
                _ => error("Expected tuple")
            }
        },
        _ => error("Expected inline datum")
    }
}`;
};
