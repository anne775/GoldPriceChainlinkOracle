"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
    useAccount,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { tokenABI } from "@/components/tokenABI";
import { TOKEN_CONTRACT_ADDRESS, COLLATERAL_TOKEN_CONTRACT_ADDRESS } from "@/components/constants";
import { erc20Abi } from "viem";
import NFTCollection from "@/components/NFTCollection";

export default function Home() {
    const { address, isConnected } = useAccount();
    const [mintAmount, setMintAmount] = useState("0.01");
    const [balance, setBalance] = useState<string | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [approved, setApproved] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const amount = parseUnits(mintAmount, 18);

    // ----- Approve Collateral -----
    const { writeContract: approveContract, data: approveHash } = useWriteContract();
    const { isLoading: approving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

    const handleApprove = async () => {
        if (!isConnected) return alert("Connect your wallet first");
        setErrorMessage(null);
        try {
            approveContract({
                address: COLLATERAL_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
                abi: erc20Abi,
                functionName: "approve",
                args: [TOKEN_CONTRACT_ADDRESS as `0x${string}`, amount],
            });
        } catch (error) {
            console.error("Approval error:", error);
            setErrorMessage("Approval failed. Please try again.");
        }
    };

    // ----- Mint with Collateral -----
    const { writeContract: mintContract, data: mintHash, isPending, isError } = useWriteContract();
    const { isLoading: txLoading, isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

    const handleMint = async () => {
        if (!isConnected) return alert("Connect your wallet first");
        setErrorMessage(null);
        try {
            mintContract({
                address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
                abi: tokenABI,
                functionName: "mintWithCollateral",
                args: [amount],
            });
        } catch (contractError) {
            console.error("Minting error:", contractError);
            setErrorMessage("Minting failed. Please try again.");
        }
    };

    // ----- Read: allowance -----
    const { refetch: refetchAllowance, data: allowanceData } = useReadContract({
        address: COLLATERAL_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as `0x${string}`, TOKEN_CONTRACT_ADDRESS as `0x${string}`],
        query: { enabled: false },
    });

    const fetchAllowance = useCallback(async () => {
        if (!address) return;
        try {
            const { data } = await refetchAllowance();
            // Check if allowance is sufficient - if so, no need to approve again
            const hasEnoughAllowance = data !== undefined && data !== null && BigInt(data) >= amount;
            setApproved(hasEnoughAllowance);
        } catch (err) {
            console.error(err);
            setApproved(false);
        }
    }, [address, amount, refetchAllowance]);

    useEffect(() => {
        if (isConnected) fetchAllowance();
    }, [isConnected, address, fetchAllowance, approveSuccess, mintSuccess]);

    // ----- Read: balanceOf -----
    const { refetch: refetchBalance } = useReadContract({
        address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
        abi: tokenABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
        query: { enabled: false },
    });

    const fetchBalance = useCallback(async () => {
        if (!address) return;
        setLoadingBalance(true);
        try {
            const { data } = await refetchBalance();
            setBalance(data ? data.toString() : "0");
        } catch (err) {
            console.error(err);
            setBalance("0");
        } finally {
            setLoadingBalance(false);
        }
    }, [address, refetchBalance]);

    useEffect(() => {
        if (isConnected) fetchBalance();
    }, [isConnected, address, fetchBalance]);

    useEffect(() => {
        if (mintSuccess) fetchBalance();
    }, [mintSuccess, fetchBalance]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50 to-green-50">
            {/* (All sections above remain the same) */}

            {/* Footer */}
            <footer className="bg-emerald-900 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center">
                                    <span className="text-xl">🐼</span>
                                </div>
                                <span className="text-xl font-bold">Monster NFT</span>
                            </div>
                            <p className="text-emerald-300 text-sm">
                                Nature's finest digital collectibles
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold mb-3 text-lg">Explore</h3>
                            <ul className="space-y-2 text-emerald-200 text-sm">
                                <li><a href="#home" className="hover:text-white">Home</a></li>
                                <li><a href="#collection" className="hover:text-white">Collection</a></li>
                                <li><a href="#mint" className="hover:text-white">Mint</a></li>
                                <li><a href="#about" className="hover:text-white">About</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold mb-3 text-lg">Resources</h3>
                            <ul className="space-y-2 text-emerald-200 text-sm">
                                <li><a href="#" className="hover:text-white">Docs</a></li>
                                <li><a href="#" className="hover:text-white">FAQ</a></li>
                                <li><a href="#" className="hover:text-white">Community</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold mb-3 text-lg">Connect</h3>
                            <ul className="space-y-2 text-emerald-200 text-sm">
                                <li><a href="#" className="hover:text-white">Twitter</a></li>
                                <li><a href="#" className="hover:text-white">Discord</a></li>
                                <li><a href="#" className="hover:text-white">Instagram</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-emerald-800 pt-6 text-center text-sm text-emerald-400">
                        © {new Date().getFullYear()} Monster NFT. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
