import Seed from './contracts/Seed.json';
import ERC20 from './contracts/ERC20.json';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card } from 'react-bootstrap';
import { parseWhiteList, parseName } from './helpers';

const SeedCard = ({address, web3, network, account, gasPriceUrl}) => {

    const [isLoaded, setIsLoaded] = useState(false);
    const [seed, setSeed] = useState();
    const [seedToken, setSeedToken] = useState();
    const [seedTokenName, setSeedTokenName] = useState();
    const [seedTokenSymbol, setSeedTokenSymbol] = useState();
    const [fundingToken, setFundingToken] = useState();
    const [fundingTokenName, setFundingTokenName] = useState();
    const [fundingTokenSymbol, setFundingTokenSymbol] = useState();
    const [requiredTokens, setRequiredTokens] = useState('0');
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [isFunded, setIsFunded] = useState(false);
    const [seedBalance, setSeedBalance] = useState();
    const [fundingBalance, setFundingBalance] = useState();
    const [metadata, setMetadata] = useState();
    const [admin, setAdmin] = useState();
    const [refundReceiver, setRefundReceiver] = useState();
    const [name, setName] = useState();
    const [isPaused, setIsPaused] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    useEffect(() => {
        const seed = new web3.eth.Contract(Seed.abi, address);
        const getToken = async () => {
            const seedTokenAddress = await seed.methods.seedToken().call();
            const token = new web3.eth.Contract(ERC20.abi, seedTokenAddress);
            setSeedToken(token);
        };
        const getFundingToken = async () => {
            const fundingToken = await seed.methods.fundingToken().call();
            const token = new web3.eth.Contract(ERC20.abi, fundingToken);
            setFundingToken(token);
        }
        setSeed(seed);
        getToken();
        getFundingToken();
    },[address, web3]);

    useEffect(
        () => {
            if(
                seedToken != undefined && fundingToken != undefined
            ) {
                setIsLoaded(true);
            }
        }, [seedToken, fundingToken]
    )

    const getSeedTokenName = async () => {
        const name = await seedToken.methods.name().call();
        const symbol = await seedToken.methods.symbol().call();
        setSeedTokenName(name);
        setSeedTokenSymbol(symbol);
    }

    const getFundingTokenName = async () => {
        const name = await fundingToken.methods.name().call();
        const symbol = await fundingToken.methods.symbol().call();
        setFundingTokenName(name);
        setFundingTokenSymbol(symbol);
    }

    const calculateRequiredSeed = async () => {
        const forDistribution = await seed.methods.seedAmountRequired().call();
        const forFee = await seed.methods.feeAmountRequired().call();
        setRequiredTokens(((new web3.utils.BN(forDistribution)).add(new web3.utils.BN(forFee))).toString());
    }
    const checkIfWhiteList = async () => {
        const isWhitelisted = await seed.methods.permissionedSeed().call();
        setIsWhitelisted(isWhitelisted);
    }
    const checkIfFunded = async () => {
        const isFunded = await seed.methods.isFunded().call();
        setIsFunded(isFunded);
    }
    const checkBalance = async () => {
        const seedBalance = await seedToken.methods.balanceOf(address).call();
        const fundingBalance = await fundingToken.methods.balanceOf(address).call();
        setSeedBalance(seedBalance);
        setFundingBalance(fundingBalance);
    }

    const getMetadata = async () => {
        const hashedMetadata = await seed.methods.metadata().call();
        const metadata = web3.utils.toAscii(hashedMetadata);
        setMetadata(metadata);
    }

    const getAdmin = async () => {
        setAdmin(await seed.methods.admin().call());
    }

    const fundSeed = async () => {
        try{
            const gas = await seedToken.methods.transfer(seed.options.address, requiredTokens).estimateGas({from: account});
            const gasPrice = await getGasPrice();
            const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
            alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
            await seedToken.methods.transfer(seed.options.address, requiredTokens).send({
                from : account,
                gas,
                gasPrice
            });
        } catch (error) {
            alert(error.message);
        }
    }

    const getGasPrice = async () => {
        const unparsedGasPrice = (await axios.get(gasPriceUrl)).data.average/10
        return web3.utils.toWei(
            unparsedGasPrice.toString(),
            'gwei'
            );
    }

    const addWhitelist = async () => {
        const whitelists = await parseWhiteList(metadata);
        alert(`This address will be added as whitelist:- ${whitelists}`);
        try{
            const gas = await seed.methods.whitelistBatch(whitelists).estimateGas({from: account});
            const gasPrice = await getGasPrice();
            const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
            alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
            await seed.methods.whitelistBatch(whitelists).send({
                from: account,
                gas,
                gasPrice 
            });
        } catch (error) {
            alert(error.message);
        }
    }

    const getSeedStatus = async () => {
        setIsPaused(await seed.methods.paused().call());
        setIsClosed(await seed.methods.closed().call());
    }

    const pause  = async () => {
        if(!isPaused){
            try{
                const gas = await seed.methods.pause().estimateGas({from: account});
                const gasPrice = await getGasPrice();
                const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
                alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
                await seed.methods.pause().send({
                    from: account,
                    gas,
                    gasPrice
                });
            } catch (error) {
                alert(error.message);
            }
            return;
        }
        alert("Seed is already Paused");
    }

    const unpause = async () => {
        if(isPaused){
            try{
                const gas = await seed.methods.unpause().estimateGas({from: account});
                const gasPrice = await getGasPrice();
                const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
                alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
                await seed.methods.unpause().send({
                    from: account,
                    gas,
                    gasPrice
                });
            }catch (error){
                alert(error.message);
            }
            return;
        }
        alert("Seed is already Unpaused");
    }

    const close = async () => {
        if(!isClosed){
            try{
                const gas = await seed.methods.close().estimateGas({from: account});
                const gasPrice = await getGasPrice();
                const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
                alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
                await seed.methods.close().send({
                    from: account,
                    gas,
                    gasPrice
                });
            } catch (error) {
                alert(error.message);
            }
            return;
        }
        alert("Seed is already Closed");
    }

    const formatPrice = (type, amount) => {
        let symbol = type === 1 ? fundingTokenSymbol : seedTokenSymbol;
        const balanceInEth = web3.utils.fromWei(new web3.utils.BN(amount));
        return `${balanceInEth} ${symbol}`;
    }

    const retrieveSeedTokens = async () => {
        if(refundReceiver?.length !== 42 || refundReceiver === undefined) {
            alert("invalid address");
            return;
        }
        try{
            const gas = await seed.methods.retrieveSeedTokens(refundReceiver).estimateGas({from: account});
            const gasPrice = await getGasPrice();
            const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
            alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
            await seed.methods.retrieveSeedTokens(refundReceiver).send({
                from : account,
                gas,
                gasPrice
            });
        } catch (error) {
            alert(error.message);
        }
    };

    const withdraw = async () => {
        try{
            const gas = await seed.methods.withdraw().estimateGas({from: account});
            const gasPrice = await getGasPrice();
            const cost = (new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(gas))
            alert(`Cost of transaction:- ${web3.utils.fromWei(cost)}`);
            await seed.methods.withdraw().send({
                from : account,
                gas,
                gasPrice
            });
        } catch (error) {
            alert(error.message);
        }
    }

    useEffect(
        () => {
            if(isLoaded){
                getSeedTokenName();
                getFundingTokenName();
                getAdmin();
                calculateRequiredSeed();
                checkIfWhiteList();
                checkIfFunded();
                checkBalance();
                getSeedStatus();
                getMetadata();
            }
        },[isLoaded]
    );

    useEffect(
        () => {
            if(metadata){
                (async () => {
                    setName(await parseName(metadata));
                })();
            }
        }, [metadata]
    );

    const handleRefundReceiverInput = ({target}) => {
        setRefundReceiver(target.value);
    }

    return (
        isLoaded?(
            <Card 
                bg={"prime-seed-card"} 
                style={{
                    maxWidth: "816px", 
                    marginBottom: "20px", 
                    marginRight: "auto", 
                    marginLeft: "auto",
                    paddingLeft: "20px",
                    paddingRight: "20px"
                    }}>
              <Card.Body bsPrefix={"card-body tl"}>
                <div className={"seed-details-wrapper"}>
                    <Card.Title>{name}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                        Seed Address: <a 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        href={`https://${network==="mainnet"?"":"rinkeby."}etherscan.io/address/${seed.options.address}`}
                                        >{seed.options.address}</a>
                    </Card.Subtitle>
                    <Card.Text>
                        Admin:- {admin}<br />
                        Seed Token Address:- {seedToken.options.address}<br/>
                        Seed Token Name:- {seedTokenName}<br />
                        Funding Token Address:- {fundingToken.options.address}<br/>
                        Funding Token Name:- {fundingTokenName}<br />
                        Required Seed Tokens:- {formatPrice(0, requiredTokens)}<br/>
                        Seed Token Balance:- {formatPrice(0, seedBalance)}<br/>
                        Funding Token Balance:- {formatPrice(1, fundingBalance)}<br/>
                        isFunded:- {isFunded.toString()}<br/>
                        isWhitelisted:- {isWhitelisted.toString()}<br/>
                        isClosed:- {isClosed.toString()}<br/>
                        isPaused:- {isPaused.toString()}<br/>
                    </Card.Text>
                    <Card.Text>
                        <div class="mb-3">
                          <label for="retrieveSeedToken" class="form-label">Refund receiver address for retrieving seed tokens</label>
                          <input type="text" onChange={handleRefundReceiverInput} class="form-control" id="retrieveSeedToken" placeholder="0x123456789......" />
                          <Button bsPrefix={"prime-btn btn"} type={'button'} onClick={retrieveSeedTokens}>Retrieve Seed Tokens</Button>
                        </div>
                    </Card.Text>
                </div>
                <div className={"seed-action-wrapper"}>
                    <Button bsPrefix={"prime-btn btn"} type={'button'} onClick={getSeedStatus}>Refresh Seed Status</Button>
                    {
                        isClosed?
                            null
                            :
                            (<>
                                <Button bsPrefix={"prime-btn btn"} type={'button'} onClick={close}>Close</Button>
                                {
                                    isPaused?
                                        <Button bsPrefix={"prime-btn btn"} type={'button'} onClick={unpause}>Unpause</Button>
                                        :
                                        <Button bsPrefix={"prime-btn btn"} type={'button'} onClick={pause}>Pause</Button>
                                }
                                {
                                    isWhitelisted?
                                        <Button bsPrefix={"prime-btn btn"} type={'button'} onClick={addWhitelist}>Add Whitelist</Button>
                                        :
                                        null
                                }
                                {
                                    (!isFunded && seedBalance === '0')?
                                        <Button bsPrefix={"prime-btn btn"} type={'button'} onClick={fundSeed}>Fund</Button>
                                        :
                                        null
                                }
                                {
                                        <Button bsPrefix={"prime-btn btn"} type={'button'} onClick={withdraw}>Withdraw</Button>
                                }
                            </>)
                        }
                </div>
              </Card.Body>
            </Card>
            )
            :
            <div>Loading...</div>
    )
}

export default SeedCard;