import { isAddress } from '@ethersproject/address'
import { wei } from '@synthetixio/wei'

import { AddressWhitelistProps } from '@/src/components/pools/whitelist/addresses/AddressesWhiteList'
import { NftType } from '@/src/components/pools/whitelist/nft/nftWhiteListReducer'
import { Chains, ChainsValues, getNetworkConfig } from '@/src/constants/chains'
import { POOL_NAME_MAX_LENGTH, ZERO_BN } from '@/src/constants/misc'
import { Privacy } from '@/src/constants/pool'
import { ONE_DAY_IN_SECS, ONE_MINUTE_IN_SECS } from '@/src/constants/time'
import { Token } from '@/src/constants/token'
import {
  CreateUpFrontDealSteps,
  DealAttr,
  ExchangeRatesAttr,
  VestingScheduleAttr,
} from '@/src/hooks/aelin/useAelinCreateUpFrontDeal'
import { convertToSeconds } from '@/src/utils/date'

export type dealErrors = {
  [CreateUpFrontDealSteps.dealAttributes]: DealAttr
  [CreateUpFrontDealSteps.investmentToken]?: Token
  [CreateUpFrontDealSteps.redemptionDeadline]?: Duration
  [CreateUpFrontDealSteps.sponsorFee]: number
  [CreateUpFrontDealSteps.holderAddress]?: string
  [CreateUpFrontDealSteps.dealToken]?: Token
  [CreateUpFrontDealSteps.exchangeRates]?: ExchangeRatesAttr
  [CreateUpFrontDealSteps.vestingSchedule]?: VestingScheduleAttr
  [CreateUpFrontDealSteps.dealPrivacy]?: Privacy
  whitelist?: AddressWhitelistProps[]
}

const validateCreateDirectDeal = (values: dealErrors, chainId: ChainsValues) => {
  const errors: any = {}

  const currentNetwork = getNetworkConfig(chainId)

  if (values.dealAttributes.name == '') {
    errors.dealAttributes = true
  } else if (values.dealAttributes.name.length > POOL_NAME_MAX_LENGTH) {
    errors.dealAttributes = 'No more than 30 chars'
  }

  if (values.dealAttributes?.symbol == '') {
    errors.dealAttributes = true
  } else if (values.dealAttributes.symbol.length > 7) {
    errors.dealAttributes = 'No more than 7 chars'
  }

  if (!values.investmentToken) {
    errors.investmentToken = true
  } else if (!isAddress(values.investmentToken?.address as string)) {
    errors.investmentToken = 'Invalid Ethereum address'
  }

  if (values.sponsorFee < 0) {
    errors.sponsorFee = true
  }

  if (Number(values.sponsorFee) > 15) {
    errors.sponsorFee = 'Must be <= 15'
  }

  if (!values.holderAddress) {
    errors.holderAddress = true
  } else if (!isAddress(values.holderAddress as string)) {
    errors.holderAddress = 'Invalid ethereum address'
  }

  if (
    !values.redemptionDeadline?.days &&
    !values.redemptionDeadline?.hours &&
    !values.redemptionDeadline?.minutes
  ) {
    errors.redemptionDeadline = true
  } else {
    const redemptionDeadLineSeconds = convertToSeconds({
      days: values.redemptionDeadline?.days ?? 0,
      hours: values.redemptionDeadline?.hours ?? 0,
      minutes: values.redemptionDeadline?.minutes ?? 0,
    })

    if (redemptionDeadLineSeconds > ONE_DAY_IN_SECS * 30) {
      errors.redemptionDeadline = 'Max redemption deadline is 30 days'
    } else if (currentNetwork.isProd && redemptionDeadLineSeconds < ONE_MINUTE_IN_SECS * 30) {
      errors.redemptionDeadline = 'Min redemption deadline is 30 mins'
    } else if (redemptionDeadLineSeconds < ONE_MINUTE_IN_SECS) {
      errors.redemptionDeadline = 'Min redemption deadline is 1 min'
    }
  }

  if (!values.dealToken) {
    errors.dealToken = true
  } else if (!isAddress(values.dealToken.address as string)) {
    errors.dealToken = 'Invalid ethereum address'
  } else if (values.dealToken.address === values.investmentToken?.address) {
    errors.dealToken = 'The deal and investment token cannot be the same'
  } else if (
    // TODO: Remove these checks completely when new version of contracts will be deployed.
    chainId !== Chains.goerli &&
    chainId !== Chains.mainnet &&
    values.investmentToken &&
    values.dealToken.decimals < values.investmentToken.decimals
  ) {
    errors.dealToken =
      'The number of decimals in the deal token must be equal or higher to the number of decimals in the investment token'
  }

  if (!values.dealPrivacy) {
    errors.dealPrivacy = true
  } else if (values.dealPrivacy === Privacy.PRIVATE && !values.whitelist?.length) {
    errors.dealPrivacy = 'Add addresses or change pool access to public'
  } else if (
    values.dealPrivacy === Privacy.NFT &&
    !Object.hasOwn(values, NftType.erc721) &&
    !Object.hasOwn(values, NftType.erc1155)
  ) {
    errors.dealPrivacy = 'Add collections or change pool access to public'
  }

  if (
    !values.exchangeRates?.investmentTokenToRaise &&
    !values.exchangeRates?.exchangeRates &&
    !values.exchangeRates?.hasDealMinimum &&
    !values.exchangeRates?.minimumAmount
  ) {
    errors.exchangeRates = true
  } else {
    if (!values.exchangeRates?.investmentTokenToRaise) {
      errors.exchangeRates = 'Set how much you want to raise'
    } else {
      if (!values.exchangeRates?.exchangeRates) {
        errors.exchangeRates = 'Set an exchange rate'
      } else {
        const exchangeRatesInWei = wei(
          values.exchangeRates?.exchangeRates,
          values.investmentToken?.decimals,
        )
        if (!exchangeRatesInWei.gt(ZERO_BN)) {
          errors.exchangeRates = 'The exchange rate has to be greater than zero'
        } else {
          const underlyingDealTokenTotal = wei(
            values.exchangeRates?.investmentTokenToRaise,
            values.dealToken?.decimals,
          ).mul(wei(values.exchangeRates?.exchangeRates, values.dealToken?.decimals))
          if (!underlyingDealTokenTotal.gt(ZERO_BN)) {
            errors.exchangeRates =
              'The deal total has to be greater than zero, please increase amount to raise or the exchange rate'
          } else {
            const investmentPerDeal = wei(1, values.investmentToken?.decimals).div(
              exchangeRatesInWei,
            )
            if (!investmentPerDeal.gt(ZERO_BN)) {
              errors.exchangeRates =
                'Deal token price has to be greater than zero, please decrease the exchange rate'
            } else {
              if (values.exchangeRates?.hasDealMinimum) {
                if (!values.exchangeRates?.minimumAmount) {
                  errors.exchangeRates = 'Invalid minimum amount'
                } else if (
                  Number(values.exchangeRates?.minimumAmount) >
                  Number(values.exchangeRates?.investmentTokenToRaise)
                ) {
                  errors.exchangeRates =
                    'The deal minimum has to be equal or less than the amount you would like to raise'
                }
              }
            }
          }
        }
      }
    }
  }

  if (
    convertToSeconds({
      days: values.vestingSchedule?.vestingCliff?.days ?? 0,
      hours: values.vestingSchedule?.vestingCliff?.hours ?? 0,
      minutes: values.vestingSchedule?.vestingCliff?.minutes ?? 0,
    }) >
    1825 * ONE_DAY_IN_SECS
  ) {
    errors.vestingSchedule = 'The vesting cliff max is 5 years or 1825 days'
  }

  if (
    convertToSeconds({
      days: values.vestingSchedule?.vestingPeriod?.days ?? 0,
      hours: values.vestingSchedule?.vestingPeriod?.hours ?? 0,
      minutes: values.vestingSchedule?.vestingPeriod?.minutes ?? 0,
    }) >
    1825 * ONE_DAY_IN_SECS
  ) {
    errors.vestingSchedule = 'The vesting period max is 5 years or 1825 days'
  }

  return errors
}

export default validateCreateDirectDeal
