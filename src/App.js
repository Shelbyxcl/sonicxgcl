import { useAccount } from "wagmi";
import logo from "./logo.png";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Swal from "sweetalert2";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import styled from "styled-components";
import BrettMinerABI from "./abis/BrettMinerABI.json";
import "./App.css"; // Assurez-vous que ce fichier est bien importé
import ChatBot from "./chatbot";


// Adresse du contrat et du token Sonic
const contractAddress = "0x2Fc0071a3eBaCF4236395061Df03ee5ec354963f";
const sonicTokenAddress = "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38";

const BOX = styled.section`
  text-align: left;
`;

const Section2 = styled.section`
  text-align: left;
`;

const LeftSection = styled.div`
  width: 50%;
  padding-right: 20px;
`;

const Section = styled.section`
  margin: 18px 0;
  padding: 15px;
  border: 1px solid gray;
  text-align: left;
  border-radius: 15px;
`;

const Button = styled.button`
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  color: black;
  cursor: pointer;
  border-radius: 5px;
  margin: 5px;
`;

const Image = styled.img`
  width: 100%;
  border-radius: 10px;
`;

const ReferralSection = styled.div`
  margin-top: 20px;
  padding: 10px;
`;




function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [marketPoints, setMarketPoints] = useState(0);
  const [myPoints, setMyPoints] = useState(0);
  const [myMiners, setMyMiners] = useState(0);
  const [claimPower, setClaimPower] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [tvl, setTVL] = useState({ eth: 0, usd: 0 });
  const [sonicBalance, setSonicBalance] = useState(0);
  const [halvingPercentage, setHalvingPercentage] = useState(100);
  const [sonicPrice, setSonicPrice] = useState(0);
  const [userReward, setUserReward] = useState(0);
  const [referral, setReferral] = useState(
    "0x0000000000000000000000000000000000000000"
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralFromUrl = urlParams.get("ref");

    if (referralFromUrl) {
      setReferral(referralFromUrl);  // Si présent, on définit 'referral'
    } else {
      setReferral("0x0000000000000000000000000000000000000000");  // Sinon on met l'adresse par défaut
    }
  }, []);





  const initializeContract = async (useSigner) => {
    // Vérifier si MetaMask est présent
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
  
      // Vérifier si un compte est connecté
      const signer = provider.getSigner();
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) {
        // Si aucun compte n'est connecté, utiliser un provider public
        console.warn("MetaMask is detected but no account is connected. Using a default provider.");
        return new ethers.Contract(
          contractAddress,
          BrettMinerABI,
          provider // Utilisation du provider sans signer
        );
      } else {
        // Si un compte est connecté, utiliser le signer
        return new ethers.Contract(
          contractAddress,
          BrettMinerABI,
          signer // Utilisation du signer de MetaMask
        );
      }
    } else {
      // Fallback sur un provider public (Alchemy ou Infura) si MetaMask n'est pas détecté
      console.warn("MetaMask not detected. Using a default provider.");
      const provider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
  
      // Retourner le contrat sans signer
      return new ethers.Contract(contractAddress, BrettMinerABI, provider);
    }
  };
  

  
  
  

  const fetchSonicBalance = async (address) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const SonicTokenContract = new ethers.Contract(
      sonicTokenAddress,
      ["function balanceOf(address account) external view returns (uint256)"],
      provider
    );
    try {
      const balance = await SonicTokenContract.balanceOf(address);
      const formattedBalance = parseFloat(ethers.utils.formatEther(balance)).toFixed(2); // Limite à 2 décimales
      setSonicBalance(formattedBalance);
    } catch (err) {
      console.error("Error fetching Sonic balance:", err);
      setSonicBalance(0);
    }
  };
  
  const fetchDynamicData = async () => {
    try {
      const sonicMinerContract = await initializeContract();
      const balance = await sonicMinerContract.getBalance(); // Balance du contrat (TVL en ETH)
      const tokenPrice = await fetchTokenPrice(); // Prix du token en USD
      const miners = await sonicMinerContract.getMyMiners(); // Récupération des miners
      const rewardInSONIC = userReward;

      // Conversion des valeurs
      const tvlETH = parseFloat(ethers.utils.formatEther(balance)).toFixed(2);
      const tvlUSD = (tvlETH * tokenPrice).toFixed(2);
  
      return {
        tvlETH,
        tvlUSD,
        balance: sonicBalance,
        reward: rewardInSONIC,
        tokenPrice: sonicPrice,
        claimPower,
        miners: miners.toString(), // Ajout du nombre de miners
      };
    } catch (err) {
      console.error("Error fetching dynamic data:", err);
      return {
        tvlETH: "0",
        tvlUSD: "0",
        balance: "0",
        reward: "0",
        tokenPrice: "0",
        claimPower: "0",
        miners: "0", // Valeur par défaut en cas d'erreur
      };
    }
  };
  


  const fetchReward = async () => {
    try {
      const sonicMinerContract = await initializeContract(true); // Avec signer
      const myPoints = await sonicMinerContract.getMyPoints();
      const reward = await sonicMinerContract.calculatePointSell(myPoints);
      const formattedReward = parseFloat(ethers.utils.formatEther(reward)).toFixed(4); // Limite à 2 décimales
      setUserReward(formattedReward);
    } catch (err) {
      console.error("Error fetching reward:", err);
      setUserReward(0);
    }
  };
  

  const fetchContractData = async () => {
    try {
      const sonicMinerContract = await initializeContract(true); // Avec signer
      const points = await sonicMinerContract.getMyPoints();
      const miners = await sonicMinerContract.getMyMiners();
      const marketPoints = await sonicMinerContract.marketPoints();
      const claimPower = await sonicMinerContract.getHalvingPercentage();
  
      setMyPoints(ethers.utils.formatEther(points));
      setMyMiners(miners.toString());
      setMarketPoints(marketPoints.toString());
      setClaimPower(ethers.utils.formatUnits(claimPower, 18));
  
      // Retourne les données nécessaires
      return {
        myPoints: ethers.utils.formatEther(points),
        myMiners: miners.toString(),
        marketPoints: marketPoints.toString(),
        claimPower: ethers.utils.formatUnits(claimPower, 18),
      };
    } catch (err) {
      console.error("Error fetching contract data:", err);
      return {
        myPoints: 0,
        myMiners: 0,
        marketPoints: 0,
        claimPower: 0,
      };
    }
  };
  

  const fetchTVL = async () => {
    const sonicMinerContract = await initializeContract(false); // Pas besoin de signer pour cette opération
  
    if (!sonicMinerContract) {
      setTVL({ eth: 0, usd: 0 });
      return;
    }
  
    try {
      const balance = await sonicMinerContract.getBalance();
      const tokenPrice = await fetchTokenPrice(); // Implémentez fetchTokenPrice selon vos besoins
      const tvlInEth = parseFloat(ethers.utils.formatEther(balance)).toFixed(2);
      setTVL({
        eth: tvlInEth,
        usd: (tvlInEth * tokenPrice).toFixed(2),
      });
    } catch (err) {
      console.error("Error fetching TVL:", err);
      setTVL({ eth: 0, usd: 0 });
    }
  };
  


// Variables pour le cache
let cachedPrice = null; 
let lastFetchTime = 0; 

// Fonction pour récupérer le prix via DexScreener
const fetchTokenPrice = async () => {
  const now = Date.now();

  // Si le prix est déjà en cache et récent (moins de 2 minutes)
  if (cachedPrice !== null && now - lastFetchTime < 120 * 1000) {
    return cachedPrice;
  }

  try {
    const response = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=0x532f27101965dd16442E59d40670FaF5eBB142E4"
    );
    const data = await response.json();

    if (data && data.pairs && data.pairs.length > 0) {
      const priceUSD = parseFloat(data.pairs[0].priceUsd);
      cachedPrice = priceUSD; // Met à jour le cache
      lastFetchTime = now; // Met à jour le timestamp du dernier fetch
      return cachedPrice;
    } else {
      console.error("Token price not found in the DexScreener response.");
      return cachedPrice || 0;
    }
  } catch (err) {
    console.error("Error fetching token price from DexScreener:", err);
    return cachedPrice || 0; // Retourne la dernière valeur en cache ou 0
  }
};
  



const depositETH = async (amount) => {
  const sonicMinerContract = await initializeContract();

  try {
    // Afficher un popup "pending" pendant le traitement
    Swal.fire({
      title: "Processing Deposit...",
      text: "Please wait while your ETH is being deposited.",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
      width: "400px",
      background: "#f4f4f4",
      customClass: {
        popup: "swal-popup-bottom-right", // Optionnel : pour positionner en bas à droite
      },
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Lancer la transaction de dépôt d'ETH
    const tx = await sonicMinerContract.depositETH(
      ethers.utils.parseEther(amount),
      referral, // Utilisation de l'adresse de parrainage
      { value: ethers.utils.parseEther(amount) }
    );
    await tx.wait();

    // Afficher un popup de succès après le dépôt
    Swal.fire({
      title: "Deposit ETH successful!",
      text: "Now, work for your bag!",
      icon: "success",
      confirmButtonText: "OK",
      width: "400px",
      background: "#f4f4f4",
      confirmButtonColor: "#0553F7",
    });

    // Actualiser les données après le dépôt
    fetchTVL();
  } catch (err) {
    console.error("Error during ETH deposit:", err);

    // Afficher un message d'erreur si quelque chose ne va pas
    Swal.fire({
      title: "Error",
      text: err.message || "An error occurred during the transaction.",
      icon: "error",
      confirmButtonText: "OK",
      width: "400px",
      background: "#f4f4f4",
      confirmButtonColor: "#f44336",
    });
  }
};

  

  const depositSonic = async (amount) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const sonicTokenContract = new ethers.Contract(
      sonicTokenAddress,
      [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)",
      ],
      signer
    );
    const sonicMinerContract = await initializeContract();
  
    try {
      // Afficher un popup "pending" pour le processus global
      Swal.fire({
        title: "Processing...",
        text: "Please wait while the transaction is processed.",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        width: "400px",
        background: "#f4f4f4",
        didOpen: () => {
          Swal.showLoading();
        },
      });
  
      // Vérification de l'autorisation de transfert du token
      const allowance = await sonicTokenContract.allowance(
        walletAddress,
        contractAddress
      );
      const amountInWei = ethers.utils.parseUnits(amount, 18);
  
      // Si l'autorisation est insuffisante, approuver le contrat pour dépenser des tokens
      if (allowance.lt(amountInWei)) {
        const approveTx = await sonicTokenContract.approve(
          contractAddress,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
  
        // Mettre à jour le popup après l'approbation
        Swal.update({
          title: "Approval successful!",
          text: "Starting deposit...",
          icon: "success",
          showConfirmButton: false, // Pas de bouton "OK", transition directe vers le dépôt
        });
  
        // Lancer un nouveau popup "pending" pour le dépôt
        Swal.fire({
          title: "Processing Deposit...",
          text: "Your Sonic tokens are being deposited.",
          icon: "info",
          allowOutsideClick: false,
          showConfirmButton: false,
          width: "400px",
          background: "#f4f4f4",
          didOpen: () => {
            Swal.showLoading();
          },
        });
      }
  
      // Déposer les tokens en utilisant l'adresse de parrainage
      const depositTx = await sonicMinerContract.depositSonic(
        amountInWei,
        referral // Utilisation de l'adresse de parrainage ici
      );
      await depositTx.wait();
  
      // Afficher un popup de succès après le dépôt
      Swal.fire({
        title: "Deposit Sonic successful!",
        text: "Now, work for your bag!",
        icon: "success",
        confirmButtonText: "OK",
        width: "400px",
        background: "#f4f4f4",
        confirmButtonColor: "#0553F7",
      });
    } catch (err) {
      console.error("Error during Sonic deposit:", err);
  
      // Afficher un message d'erreur si quelque chose ne va pas
      Swal.fire({
        title: "Error",
        text: err.message || "An error occurred during the transaction.",
        icon: "error",
        confirmButtonText: "OK",
        width: "400px",
        background: "#f4f4f4",
        confirmButtonColor: "#f44336",
      });
    }
  };
  
  

  const compound = async () => {
    const sonicMinerContract = await initializeContract();
    
    // Afficher le popup "pending" avant la transaction
    Swal.fire({
      title: "Processing...",
      text: "Please wait while the transaction is processed.",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
      width: "400px",
      background: "#f4f4f4",
      didOpen: () => {
        Swal.showLoading(); // Afficher l'animation de chargement
      }
    });
  
    try {
      // Appel à la fonction compound du contrat
      const tx = await sonicMinerContract.compound(
        "0x0000000000000000000000000000000000000000"
      );
      
      // Attendre la confirmation de la transaction
      await tx.wait();
      
      // Fermer le popup et afficher le succès
      Swal.fire({
        title: "Success!",
        text: "Compound successful!",
        icon: "success",
        confirmButtonText: "OK",
        width: "400px",
        background: "#f4f4f4", // Couleur d'arrière-plan
        confirmButtonColor: "#0553F7",
      });
    } catch (err) {
      console.error("Error during compound:", err);
      
      // Fermer le popup et afficher l'erreur
      Swal.fire({
        title: "Error!",
        text: "Something went wrong, please try again.",
        icon: "error",
        confirmButtonText: "OK",
        width: "400px",
        background: "#f4f4f4",
        confirmButtonColor: "#FF0000",
      });
    }
  };
  
  

  const withdraw = async () => {
    // Affichage du pop-up de pending
    Swal.fire({
      title: "Processing Withdraw...",
      text: "Your Sonic tokens are being deposited.",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
      width: "400px",
      background: "#f4f4f4",
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    const sonicMinerContract = await initializeContract();
    try {
      const tx = await sonicMinerContract.withdraw();
      await tx.wait(); // Attente de la confirmation de la transaction
  
      // Fermeture du pop-up et affichage du pop-up de succès
      Swal.fire({
        title: "Success!",
        text: "Withdraw successful!",
        icon: "success",
        confirmButtonText: "OK",
        width: "400px",
        background: "#f4f4f4",
        confirmButtonColor: "#0553F7",
      });
    } catch (err) {
      // Si une erreur se produit, affichage d'un pop-up d'erreur
      Swal.fire({
        title: "Error",
        text: "An error occurred during the withdrawal. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        width: "400px",
        background: "#f4f4f4",
        confirmButtonColor: "#F75C55",
      });
      console.error("Error during withdrawal:", err);
    }
  };

  const {address} = useAccount();
  useEffect(() => {
    try {
        setWalletAddress(address);
    } catch (err) {
        console.error("Error connecting wallet:", err);
    }
  })

  const copyReferralLink = () => {
    if (walletAddress) {
      // Générer le lien de parrainage avec l'adresse du wallet
      const referralLink = `${window.location.origin}/?ref=${walletAddress}`;
      navigator.clipboard
        .writeText(referralLink)
        .then(() => 
          Swal.fire({
            title: "Success!",
            text: "Referral link copied to clipboard!",
            icon: "success",
            confirmButtonText: "OK",
            width: "400px",
            background: "#f4f4f4", // Couleur d'arrière-plan
            confirmButtonColor: "#0553F7",
          })
        )
        .catch(() => 
          Swal.fire({
            title: "Oops...",
            text: "Failed to copy referral link.",
            icon: "error",
            confirmButtonText: "OK",
            width: "400px",
            background: "#f4f4f4", // Couleur d'arrière-plan
            confirmButtonColor: "#0553F7",
          })
        ); 

    } else {
      Swal.fire({
        title: "Oops...",
        text: "Connect your wallet to generate a referral link.",
        icon: "error",
        confirmButtonText: "OK",
        width: "400px",
        background: "#f4f4f4", // Couleur d'arrière-plan
        confirmButtonColor: "#0553F7",
      });
    }
  };

  useEffect(() => {
    const getPrice = async () => {
      const price = await fetchTokenPrice();
      setSonicPrice(price); // Met à jour l'état
    };

    getPrice(); // Récupère immédiatement le prix

    const interval = setInterval(getPrice, 120000); // Toutes les 2 minutes
    return () => clearInterval(interval); // Nettoyage
  }, []);

  // Calcul de la valeur revendiquable
  const claimableValue = (userReward * sonicPrice).toFixed(2);
  
  useEffect(() => {
    // Fetch TVL indépendamment de la connexion du wallet
    fetchTVL();
  
    if (walletAddress) {
      console.log("Wallet connected");
      fetchReward();
      fetchContractData();
      fetchSonicBalance(walletAddress);
    } else {
      // user disconnected
      setMyPoints(0);
      setMyMiners(0);
      setClaimPower(0);
    }
  }, [walletAddress]);


  return (
    <div className="App">
    <LeftSection className="LeftSection">
      <BOX>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            paddingRight: "40px",
          }}
        >
          <img src={logo} alt="Logo" className="logo" />
          <ConnectButton />
        </div>
      </BOX>

      <Section2>
        <hr className="custom-hr"></hr>
        <p className="custom-font">
          The $SONIC reward pool with the richest daily return and lowest dev
          fee, daily income of up to 12% and a referral bonus of 10%. &nbsp;
          <a
            href="https://brett-miner-1.gitbook.io/brett-miner"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline", color: "#44A7D2" }}
          >
            (documentation)
          </a>
        </p>
        <p className="custom-font">
          <u>
            <strong>#1 - BUY MINERS :</strong>
          </u>{" "}
          Start by using your $SONIC or $ETH to purchase miners
        </p>
        <p className="custom-font">
          <u>
            <strong>#2 - COMPOUND:</strong>
          </u>{" "}
          To maximize your earnings, click on the "COMPOUND" button. this action
          will automatically reinvest your rewards back into miners
        </p>
        <p className="custom-font">
          <u>
            <strong>#3 - CLAIM REWARDS:</strong>
          </u>{" "}
          This will transfer your accumulated $SONIC rewards directly into your
          wallet
        </p>
      </Section2>

      <Section2>
        <div
          className="flex items-center"
          style={{ display: "flex", alignItems: "center" }}
        >
          <h1
            className="custom-font"
            style={{ margin: 0, paddingRight: "10px", marginBottom: "1px" }}
          >
            <strong>REFERAL LINK</strong>
          </h1>
          <span
            style={{ flex: 1, height: "1px", backgroundColor: "black" }}
          ></span>
        </div>

        <ReferralSection
          className="custom-font"
          style={{ textAlign: "center" }}
        >
          <Button className="button-87" onClick={copyReferralLink}>
            Copy Referral Link
          </Button>
          <div style={{ paddingTop: "15px", paddingBottom: "15px" }}>
            <p className="custom-font" style={{ textAlign: "left" }}>
              Sonic Miner's referral program allows each user to get a{" "}
              <strong>10% bonus </strong>
              on the initial deposit of the person they refer. This encourages
              users to share the platform and grow the community.
            </p>
          </div>
        </ReferralSection>
      </Section2>

      <Section2>
        <div
          className="flex items-center"
          style={{ display: "flex", alignItems: "center" }}
        >
          <h1
            className="custom-font"
            style={{ margin: 0, paddingRight: "10px" }}
          >
            <strong>REWARDS</strong>
          </h1>
          <span
            style={{ flex: 1, height: "1px", backgroundColor: "black" }}
          ></span>
        </div>

        <p className="custom-font">
          The key to maximizing your rewards lies in the quantity of sonic you
          hold and how frequently you compound them. The more miner you
          accumulate and the more often you reinvest your rewards is the greater
          the potential for earning more rewards
        </p>
      </Section2>

      <Section>
        <h1
          className="custom-font"
          style={{ fontWeight: "bold", textAlign: "center"}}
        >
          SONIC MINERS
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            borderBottom: "1px solid black", // Ligne sous la ligne
            paddingBottom: "0px", // Ajoute un espace entre le texte et la ligne
            marginBottom: "10px",
            marginTop: "10px", // Espace entre les sections
          }}
        >
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            TVL (Total Value Locked)
          </p>
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            {tvl.eth} SONIC (${tvl.usd})
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            borderBottom: "1px solid black", // Ligne sous la ligne
            paddingBottom: "0px", // Ajoute un espace entre le texte et la ligne
            marginBottom: "10px",
            marginTop: "27px", // Espace entre les sections
          }}
        >
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            Sonic Balance:
          </p>
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            {sonicBalance} SONIC
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            borderBottom: "1px solid black", // Ligne sous la ligne
            paddingBottom: "0px", // Ajoute un espace entre le texte et la ligne
            marginBottom: "10px",
            marginTop: "27px", // Espace entre les sections
          }}
        >
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            My Miners:
          </p>
          <p
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            {myMiners}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            borderBottom: "1px solid black", // Ligne sous la ligne
            paddingBottom: "0px", // Ajoute un espace entre le texte et la ligne
            marginBottom: "10px",
            marginTop: "27px", // Espace entre les sections
          }}
        >
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            Claim Power:{" "}
          </p>
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            {claimPower * 100}%
          </p>
        </div>

        <h1 className="custom-font" style={{ textAlign: "center" }}>
          <Button
            className="button-87"
            role="button"
            onClick={() => depositETH(depositAmount)}
          >
            Deposit ETH
          </Button>
          <Button
            className="button-87"
            role="button"
            onClick={() => depositSonic(depositAmount)}
          >
            Deposit SONIC
          </Button>
        </h1>
        <h1 style={{ textAlign: "center" }}>
        <div
  className="textInputWrapper"
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%", // S'adapte à la largeur parent
    padding: "2vh", // Espacement interne autour de l'input
    boxSizing: "border-box",
  }}
>
  <input
    type="number"
    style={{
      appearance: "none",
      WebkitAppearance: "none",
      MozAppearance: "textfield",
      width: "23vw", // Largeur proportionnelle à la largeur de la fenêtre
      height: "5vh", // Hauteur proportionnelle à la hauteur de la fenêtre
      padding: "10px", // Espacement interne basé sur la hauteur de la fenêtre
      fontSize: "16px", // Taille de police proportionnelle
      border: "1px solid black", // Bordure fine adaptée
      borderRadius: "5px", // Coins arrondis proportionnels
      boxSizing: "border-box", // Assure que bordures et padding sont inclus
    }}
    placeholder="$SONIC / $ETH"
    value={depositAmount}
    onChange={(e) => setDepositAmount(e.target.value)}
  />
</div>
        </h1>

        <p style={{ fontSize: "20px" }} className="custom-font">
          Your rewards:{" "}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            borderBottom: "1px solid black", // Ligne sous la ligne
            paddingBottom: "0px", // Ajoute un espace entre le texte et la ligne
            marginBottom: "10px",
            marginTop: "27px", // Espace entre les sections
          }}
        >
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            You can claim:{" "}
          </p>
          <p
            className="custom-font"
            style={{
              margin: 0, // Supprime toute marge du texte
              padding: 0,
            }}
          >
            {userReward} SONIC (${claimableValue})
          </p>
        </div>

        <h1 className="custom-font" style={{ textAlign: "center" }}>
          <Button className="button-87" role="button" onClick={compound}>
            Compound
          </Button>
          <Button className="button-87" role="button" onClick={withdraw}>
            Withdraw
          </Button>
        </h1>
        <p
          className="custom-font"
          style={{ textAlign: "center", fontSize: "12px" }}
        >
          WITHDRAW WILL RESET THE CLAIM POWER TO 50% <br /> CLAIM POWER
          REGENERATES 10% PER DAY TILL 100%
        </p>
      </Section>

      <Section style={{ paddingTop: "20px" }}>
        <h1
          className="custom-font"
          style={{ fontWeight: "bold", textAlign: "center" }}
        >
          EXTRACTION RETURN
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            marginTop: "15px", // Ajoute un espace entre les sections si nécessaire
          }}
        >
          <p
            className="custom-font"
            style={{ margin: "0", whiteSpace: "nowrap" }}
          >
            Daily return:
          </p>
          <div
            style={{
              flex: "1",
              borderBottom: "1px dotted black",
              margin: "0 10px", // Espace entre le texte et la ligne
            }}
          ></div>
          <p
            className="custom-font"
            style={{ margin: "0", whiteSpace: "nowrap" }}
          >
            8%
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            marginTop: "15px", // Ajoute un espace entre les sections si nécessaire
          }}
        >
          <p
            className="custom-font"
            style={{ margin: "0", whiteSpace: "nowrap" }}
          >
            APR
          </p>
          <div
            style={{
              flex: "1",
              borderBottom: "1px dotted black",
              margin: "0 10px", // Espace entre le texte et la ligne
            }}
          ></div>
          <p
            className="custom-font"
            style={{ margin: "0", whiteSpace: "nowrap" }}
          >
            2,920%
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            marginTop: "15px",
          }}
        >
          <p
            className="custom-font"
            style={{ margin: "0", whiteSpace: "nowrap" }}
          >
            Dev Fee
          </p>
          <div
            style={{
              flex: "1",
              borderBottom: "1px dotted black",
              margin: "0 10px", // Espace entre le texte et la ligne
            }}
          ></div>
          <p
            className="custom-font"
            style={{ margin: "0", whiteSpace: "nowrap" }}
          >
            5%
          </p>
        </div>
      </Section>

      <div className="social-icons-container">
        <div className="telegram-icon">
          <a
            href="https://t.me/brettminerportal"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 496 512"
              width="30"
              height="30"
            >
              <path d="M248 8C111 8 0 119 0 256S111 504 248 504 496 393 496 256 385 8 248 8zM363 176.7c-3.7 39.2-19.9 134.4-28.1 178.3-3.5 18.6-10.3 24.8-16.9 25.4-14.4 1.3-25.3-9.5-39.3-18.7-21.8-14.3-34.2-23.2-55.3-37.2-24.5-16.1-8.6-25 5.3-39.5 3.7-3.8 67.1-61.5 68.3-66.7 .2-.7 .3-3.1-1.2-4.4s-3.6-.8-5.1-.5q-3.3 .7-104.6 69.1-14.8 10.2-26.9 9.9c-8.9-.2-25.9-5-38.6-9.1-15.5-5-27.9-7.7-26.8-16.3q.8-6.7 18.5-13.7 108.4-47.2 144.6-62.3c68.9-28.6 83.2-33.6 92.5-33.8 2.1 0 6.6 .5 9.6 2.9a10.5 10.5 0 0 1 3.5 6.7A43.8 43.8 0 0 1 363 176.7z" />
            </svg>
          </a>
        </div>
        <div className="twitter-icon">
          <a
            href="https://x.com/BrettMinerBase"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              width="30"
              height="30"
            >
              <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
            </svg>
          </a>
        </div>
        
      </div>
      <div className="App">
      {/* Votre contenu existant */}
      <ChatBot />
    </div>
    </LeftSection>
    

    <ChatBot fetchDynamicData={fetchDynamicData} />

    
    </div>
    
    
  );
}

export default App;
