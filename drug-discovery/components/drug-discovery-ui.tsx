"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

import Molecule1 from "./images/molecule1.png";
import Molecule2 from "./images/molecule2.png";

export function DrugDiscoveryUi() {
  const [smiles, setSmiles] = useState("");
  const [drugProperties, setDrugProperties] = useState({
    molecularWeight: null,
    logP: null,
    hBondDonors: null,
    hBondAcceptors: null,
  });
  const [potency, setPotency] = useState({
    isPotent: false,
    inhibitorType: null,
    ic50: null,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(false);
  const [error, setError] = useState("");
  const [svg, setSvg] = useState("");
  const [iupac, setIupac] = useState(null);

  useEffect(() => {
    console.log("Computational Drug Discovery");
  }, []);

  useEffect(() => {
    fetch("http://localhost:8001/")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSvg("");
    setResult(false);
    setIupac(null);
    setLoading(true);
    setError("");
    setDrugProperties({
      molecularWeight: null,
      logP: null,
      hBondDonors: null,
      hBondAcceptors: null,
    });
    setPotency({
      isPotent: false,
      inhibitorType: null,
      ic50: null,
    });

    try {
      console.log(JSON.stringify({ canonical_smiles: smiles }));
      console.log("Sending Request");
      const response = await fetch("http://localhost:8001/get_potency", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ canonical_smile: smiles }),
      });

      if (!response.ok) {
        throw new Error("Failed to get prediction");
      }

      const data = await response.json();
      console.log(data);
      setDrugProperties({
        molecularWeight: data.MW,
        logP: data.logP,
        hBondDonors: data.HBD,
        hBondAcceptors: data.HBA,
      });
      setPotency({
        isPotent: data.ispotent,
        inhibitorType: data.inhibitor,
        ic50: data.IC50,
      });
      setSvg(data.svg);
      setIupac(data.iupac);
      setResult(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4 flex justify-start gap-2 items-end">
        <img
          width="50"
          height="50"
          src="https://img.icons8.com/ios-filled/50/pill.png"
          alt="pill"
        />
        Computational Drug Discovery
      </h1>
      <p className="text-base text-muted-foreground">
        Target disease - Tuberculosis (TB)
      </p>
      <p className="text-base text-muted-foreground mb-6">
        Target inhibitor - Dihydrofolate reductase (DHFR)
      </p>

      <Tabs defaultValue="input" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="intro">Introduction</TabsTrigger>
          <TabsTrigger value="method">Methodology</TabsTrigger>
          <TabsTrigger value="disclaimer">Disclaimer</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Drug Input</CardTitle>
              <CardDescription>
                Enter the canonical SMILES of your compound
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smiles">Canonical SMILES</Label>
                  <Input
                    id="smiles"
                    placeholder="Enter SMILES notation"
                    value={smiles}
                    onChange={(e) => setSmiles(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Compound"
                  )}
                </Button>
              </form>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-10">
                <div className="flex-col">
                  {result && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">
                        Drug Properties
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          Molecular Weight: {drugProperties.molecularWeight}{" "}
                          g/mol
                        </li>
                        <li>LogP: {drugProperties.logP}</li>
                        <li>H-Bond Donors: {drugProperties.hBondDonors}</li>
                        <li>
                          H-Bond Acceptors: {drugProperties.hBondAcceptors}
                        </li>
                      </ul>
                    </div>
                  )}

                  {result && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-2">
                        Potency Prediction
                      </h3>
                      <p>
                        This compound is predicted to be an{" "}
                        <span
                          className={`font-bold ${
                            potency.inhibitorType == "Active"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {potency.inhibitorType}
                        </span>{" "}
                        inhibitor of DHFR.
                      </p>
                      <p className="mt-2">IC50: {potency.ic50} nM</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center items-center">
                  <p>{iupac}</p>
                  <div dangerouslySetInnerHTML={{ __html: svg }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intro">
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                We are glad to introduce our Computational Drug Discovery tool
                that will assist in the development of efficient Tuberculosis
                treatment. This platform employs artificial intelligence in the
                form of machine learning to forecast the efficacy of potential
                drugs against TB, focusing on the DHFR enzyme.
              </p>
              <p className="mt-4">
                Tuberculosis is one of the most critical health challenges that
                the world is facing and the emergence of drug-resistant TB makes
                it even hard to treat using currently available drugs.
                Dihydrofolate reductase (DHFR) has become one of the most sought
                after targets for the development of drugs as it plays a
                critical role in folate metabolism and bacterial survival. Using
                Quantitative Structure-Activity Relationship (QSAR) analysis
                coupled with Machine Learning approach, it is possible to
                enhance the search for potential DHFR inhibitors. These
                computational procedures discussed above make it possible to
                consider molecular features importantly involved in the
                inhibitory activity, which makes it possible to predict
                potential drug candidates without relaying solely on
                time-consuming animal testing.
              </p>
              <p className="mt-4">
                So, if you type in the canonical SMILES notation of a compound,
                you can immediately evaluate its prospects for being a TB drug
                and avoid wasting time and money in the process of developing
                new drugs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="method">
          <Card>
            <CardHeader>
              <CardTitle>Methodology</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              <p>Our drug discovery process involves several key steps:</p>
              <div className="flex-row flex justify-around items-start">
                <ol className="list-decimal pl-5 mt-4 space-y-2">
                  <li>Input of canonical SMILES notation</li>
                  <li>Calculation of molecular properties</li>
                  <li>Feature extraction and preprocessing</li>
                  <li>Machine learning model prediction</li>
                  <li>Results interpretation and visualization</li>
                </ol>
                <Image
                  src={Molecule1}
                  alt="2D Structure to Fingerprint (Molecule 1)"
                  width={150}
                  height={150}
                  className="rounded-lg"
                />
                <Image
                  src={Molecule2}
                  alt="2D Structure to Fingerprint (Molecule 2)"
                  width={135}
                  height={135}
                  className="rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disclaimer">
          <Card>
            <CardHeader>
              <CardTitle>Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                This tool is for research purposes only and should not be used
                as a substitute for professional medical advice, diagnosis, or
                treatment. The predictions made by this system are based on
                computational models and may not always accurately reflect
                real-world efficacy or safety of the compounds.
              </p>
              <p className="mt-4 mb-5">
                Always consult with qualified healthcare providers or
                pharmaceutical researchers before making any decisions based on
                these results. The developers of this tool are not responsible
                for any actions taken based on the output of this system.
              </p>
              <CardDescription>
                <span className="font-bold">Contributors </span>Shashank R, Lasyapriya Bharadwaj K, Vemula Yashodha, K Tappan Chengappa
              </CardDescription>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
