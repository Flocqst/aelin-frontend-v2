import styled from 'styled-components'

import { genericSuspense } from '../../helpers/SafeSuspense'
import { ButtonGradient } from '../../pureStyledComponents/buttons/Button'
import { BaseCard } from '../../pureStyledComponents/common/BaseCard'
import { Tooltip } from '../../tooltip/Tooltip'
import { Contents as BaseContents, Title as BaseTitle } from './Wrapper'
import { ParsedAelinPool } from '@/src/hooks/aelin/useAelinPool'
import { useAelinPoolTransaction } from '@/src/hooks/contracts/useAelinPoolTransaction'
import { useAelinPoolUpfrontDealTransaction } from '@/src/hooks/contracts/useAelinPoolUpfrontDealTransaction'
import { GasOptions, useTransactionModal } from '@/src/providers/transactionModalProvider'
import { useWeb3Connection } from '@/src/providers/web3ConnectionProvider'

const Container = styled(BaseCard)`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: fit-content;
  justify-content: center;
  padding: 30px 55px;
  gap: 10px;
`
const Title = styled(BaseTitle)`
  margin-bottom: 0;
  text-align: center;
`
const Contents = styled(BaseContents)`
  text-align: center;
  font-size: 1.5rem;
`
const Vouchers = styled.span`
  color: ${({ theme }) => theme.buttonPrimary.color};
`
const TitleWrapper = styled.div`
  align-items: center;
  display: flex;
  gap: 5px;
`

const VouchButton = styled(ButtonGradient)`
  width: 100%;
`

const Vouch: React.FC<{ pool: ParsedAelinPool }> = genericSuspense(({ pool }) => {
  const { address: userAddress } = useWeb3Connection()
  const { isSubmitting, setConfigAndOpenModal } = useTransactionModal()
  const isUpfrontDeal = !!pool.upfrontDeal

  // const hasVouched = !!pool.vouchers?.find((v: { id: string }) => v.id === userAddress)
  const hasVouched = !!pool.vouchers?.includes(userAddress || '')

  const { estimate: vouchPoolEstimate, execute: vouchPool } = useAelinPoolTransaction(
    pool.address,
    'vouch',
  )

  const { estimate: vouchUpfrontDealEstimate, execute: vouchUpfrontDeal } =
    useAelinPoolUpfrontDealTransaction(pool.address, 'vouch')

  const { estimate: disavowPoolEstimate, execute: disavowPool } = useAelinPoolTransaction(
    pool.address,
    'disavow',
  )

  const { estimate: disavowUpfrontDealEstimate, execute: disavowUpfrontDeal } =
    useAelinPoolUpfrontDealTransaction(pool.address, 'disavow')

  const handleVouchClick = async () => {
    setConfigAndOpenModal({
      onConfirm: async (txGasOptions: GasOptions) => {
        if (hasVouched) {
          isUpfrontDeal
            ? await disavowUpfrontDeal([], txGasOptions)
            : await disavowPool([], txGasOptions)
        } else {
          isUpfrontDeal
            ? await vouchUpfrontDeal([], txGasOptions)
            : await vouchPool([], txGasOptions)
        }
      },
      title: hasVouched ? 'Disavow Pool' : 'Vouch Pool',
      estimate: () => {
        if (hasVouched) {
          return isUpfrontDeal ? disavowUpfrontDealEstimate() : disavowPoolEstimate()
        } else {
          return isUpfrontDeal ? vouchUpfrontDealEstimate() : vouchPoolEstimate()
        }
      },
    })
  }

  return (
    <Container>
      <TitleWrapper>
        <Title>Vouch for this pool</Title>
        <Tooltip text="something" />
      </TitleWrapper>
      <Contents>
        Total vouchers : <Vouchers>{pool.totalVouchers}</Vouchers>{' '}
      </Contents>
      <VouchButton disabled={!userAddress || isSubmitting} onClick={handleVouchClick}>
        {hasVouched ? 'Disavow' : 'Vouch'}
      </VouchButton>
    </Container>
  )
})

export default genericSuspense(Vouch)
