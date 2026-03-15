export enum WalletTransactionType 
{
    EARNING = 'earning',
    ADJUSTMENT = 'adjustment',
    WITHDRAWAL = 'withdrawal',
    REVERSAL = 'reversal'
}

export enum WalletTransactionStatus 
{
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed'
}

export enum WithdrawalStatus 
{
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PAID = 'paid'
}
