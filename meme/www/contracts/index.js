import { memeContract } from "./memescript.js";
import { refContract } from "./refscript.js";
import { helperModule } from "./helpermodule.js";
import * as helios from "https://cdn.jsdelivr.net/npm/@hyperionbt/helios@0.13.37/helios.min.js";
import { Lucid } from "https://unpkg.com/lucid-cardano@0.10.4/web/mod.js";

const lucid = await Lucid.new();

function deployMemeContract(tokenNameUtf8, utxoHash, utxoId) {
  const MemeContract = memeContract(helios.bytesToHex(helios.textToBytes(tokenNameUtf8)), utxoHash, utxoId);
  const MemeProgram = helios.Program.new(MemeContract, [helperModule()]);
  const MemeProgramCompiled = MemeProgram.compile(true);
  const MemeScript = JSON.parse(MemeProgramCompiled.serialize()).cborHex;
  const MemeScriptLucid = {
    type: "PlutusV2",
    script: MemeScript,
  };
  const MemePolicy = lucid.utils.validatorToScriptHash(MemeScriptLucid);
  return { MemeScriptLucid, MemePolicy };
}

function deployRefContract(memePolicy, tokenNameUtf8) {
  const RefContract = refContract(memePolicy, helios.bytesToHex(helios.textToBytes(tokenNameUtf8)));
  const RefProgram = helios.Program.new(RefContract, [helperModule()]);
  const RefProgramCompiled = RefProgram.compile(true);
  const RefScript = JSON.parse(RefProgramCompiled.serialize()).cborHex;
  const RefAddress = helios.Address.fromValidatorHash(RefProgramCompiled.validatorHash, null, true).toBech32();
  const RefScriptLucid = {
    type: "PlutusV2",
    script: RefScript,
  };
  return { RefScriptLucid, RefAddress };
}

export { deployMemeContract, deployRefContract };
