from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import pandas as pd
from rdkit.Chem import Descriptors
from rdkit.Chem.Draw import rdMolDraw2D
from rdkit import Chem
import os
import joblib
import pubchempy
import uvicorn

app = FastAPI()

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def lipinski(smile):
    mol = Chem.MolFromSmiles(smile)
    if mol is None:
        return False, "Invalid SMILE"

    mw = Descriptors.MolWt(mol)
    logp = Descriptors.MolLogP(mol)
    hbd = Descriptors.NumHDonors(mol)
    hba = Descriptors.NumHAcceptors(mol)

    return [mw, logp, hbd, hba]


def get_lipinski(smile, dataframe):
    MW = []
    logP = []
    hdb = []
    hba = []

    a, b, c, d = lipinski(smile)
    MW.append(a)
    logP.append(b)
    hdb.append(c)
    hba.append(d)

    MW = pd.Series(MW, name="MW")
    logP = pd.Series(logP, name="logP")
    hdb = pd.Series(hdb, name="HBD")
    hba = pd.Series(hba, name="HBA")

    return pd.concat([dataframe, MW, logP, hdb, hba], axis=1), a, b, c, d

def process_canonical_smile(canonical_smile):
    data = {
        "canonical_smiles": [canonical_smile],
        "molecule_chembl_id": ["CHEMBL_SAMPLE"],
    }

    df = pd.DataFrame(data=data)
    df.to_csv("molecule.smi", sep="\t", index=False, header=False)

    features = [
        "PubchemFP12",
        "PubchemFP19",
        "PubchemFP20",
        "PubchemFP143",
        "PubchemFP146",
        "PubchemFP186",
        "PubchemFP187",
        "PubchemFP188",
        "PubchemFP192",
        "PubchemFP258",
        "PubchemFP259",
        "PubchemFP308",
        "PubchemFP338",
        "PubchemFP341",
        "PubchemFP345",
        "PubchemFP346",
        "PubchemFP357",
        "PubchemFP359",
        "PubchemFP365",
        "PubchemFP366",
        "PubchemFP372",
        "PubchemFP373",
        "PubchemFP374",
        "PubchemFP377",
        "PubchemFP378",
        "PubchemFP380",
        "PubchemFP381",
        "PubchemFP382",
        "PubchemFP385",
        "PubchemFP386",
        "PubchemFP388",
        "PubchemFP389",
        "PubchemFP391",
        "PubchemFP392",
        "PubchemFP405",
        "PubchemFP406",
        "PubchemFP420",
        "PubchemFP431",
        "PubchemFP435",
        "PubchemFP437",
        "PubchemFP438",
        "PubchemFP439",
        "PubchemFP440",
        "PubchemFP443",
        "PubchemFP445",
        "PubchemFP447",
        "PubchemFP451",
        "PubchemFP452",
        "PubchemFP476",
        "PubchemFP485",
        "PubchemFP491",
        "PubchemFP493",
        "PubchemFP498",
        "PubchemFP499",
        "PubchemFP502",
        "PubchemFP521",
        "PubchemFP528",
        "PubchemFP535",
        "PubchemFP536",
        "PubchemFP539",
        "PubchemFP540",
        "PubchemFP541",
        "PubchemFP542",
        "PubchemFP546",
        "PubchemFP547",
        "PubchemFP548",
        "PubchemFP553",
        "PubchemFP565",
        "PubchemFP566",
        "PubchemFP569",
        "PubchemFP572",
        "PubchemFP573",
        "PubchemFP574",
        "PubchemFP576",
        "PubchemFP577",
        "PubchemFP579",
        "PubchemFP589",
        "PubchemFP594",
        "PubchemFP597",
        "PubchemFP600",
        "PubchemFP602",
        "PubchemFP604",
        "PubchemFP606",
        "PubchemFP611",
        "PubchemFP614",
        "PubchemFP617",
        "PubchemFP619",
        "PubchemFP623",
        "PubchemFP626",
        "PubchemFP637",
        "PubchemFP638",
        "PubchemFP641",
        "PubchemFP643",
        "PubchemFP645",
        "PubchemFP646",
        "PubchemFP651",
        "PubchemFP655",
        "PubchemFP656",
        "PubchemFP659",
        "PubchemFP666",
        "PubchemFP671",
        "PubchemFP672",
        "PubchemFP680",
        "PubchemFP682",
        "PubchemFP684",
        "PubchemFP685",
        "PubchemFP689",
        "PubchemFP690",
        "PubchemFP691",
        "PubchemFP692",
        "PubchemFP693",
        "PubchemFP694",
        "PubchemFP695",
        "PubchemFP696",
        "PubchemFP697",
        "PubchemFP698",
        "PubchemFP699",
        "PubchemFP704",
        "PubchemFP707",
        "PubchemFP712",
        "PubchemFP716",
        "PubchemFP758",
        "PubchemFP779",
        "PubchemFP821",
        "MW",
        "logP",
        "HBA",
        "HBD",
    ]
    
    subprocess.call(
        [
            "java",
            "-Xms1G",
            "-Xmx1G",
            "-Djava.awt.headless=true",
            "-jar",
            "./PaDEL-Descriptor/PaDEL-Descriptor.jar",
            "-removesalt",
            "-standardizenitro",
            "-fingerprints",
            "-descriptortypes",
            "./PaDEL-Descriptor/PubchemFingerprinter.xml",
            "-dir",
            "./",
            "-file",
            "descriptors_output.csv",
            "-2d",
        ]
    )

    df, a, b, c, d = get_lipinski(canonical_smile, df)

    df_1 = pd.read_csv("./descriptors_output.csv")
    df_1 = df_1.drop(["Name"], axis=1)

    df_2 = df[["MW", "logP", "HBA", "HBD"]]
    df_3 = pd.concat([df_1, df_2], axis=1)
    df_3 = df_3[features]

    os.remove("molecule.smi")
    os.remove("descriptors_output.csv")

    return df_3, a, b, c, d

def get_pic50(df):
    model = joblib.load("./GradientBoostingRegressor.pkl")
    result = model.predict(df)
    return result

@app.get("/")
def default():
    return {"message": "Computational Drug Discovery API"}

@app.post("/get_potency")
async def get_potency(request: Request):
    body = await request.json()
    df, a, b, c, d = process_canonical_smile(body["canonical_smile"])
    pIC50 = get_pic50(df)[0]
    IC50 = 10 ** (-pIC50)
    nmIC50 = IC50 * (10**9)
    inhibitor = "Active" if nmIC50 <= 1000 else "Inactive"
    ispotent = True if nmIC50 <= 1000 else False

    drawer = rdMolDraw2D.MolDraw2DSVG(300, 300)
    mol = Chem.MolFromSmiles(body["canonical_smile"])
    drawer.DrawMolecule(mol)
    drawer.FinishDrawing()
    svg = drawer.GetDrawingText()

    compounds = pubchempy.get_compounds(body["canonical_smile"], namespace='smiles')
    match = compounds[0]
    iupac = match.iupac_name

    return {"Canonical Smile": body["canonical_smile"], "pIC50": pIC50, "IC50" : round(nmIC50, 2), "MW": round(a, 2), "logP": round(b), "HBD": c, "HBA": d, "inhibitor": inhibitor, "ispotent": ispotent, "svg": svg, "iupac": iupac}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)