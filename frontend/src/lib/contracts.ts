import KahootFactoryABI from '../abi/KahootFactory.json';
import KahootGameABI from '../abi/KahootGame.json';

// ─── Deployed Addresses ───────────────────────────────────────────────────────
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`;

// ─── ABIs ─────────────────────────────────────────────────────────────────────
export const kahootFactoryAbi = KahootFactoryABI.abi as any;
export const kahootGameAbi = KahootGameABI.abi as any;
