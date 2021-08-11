import axios from 'axios';

const fetchWhitelist = async (url) => {
    const res = await axios.get(url);
    const whitelists = (res.data).split(",");
    return whitelists.map((account) => {
        return account.replace(/\n/g, "");
    });
};

export const parseWhiteList = async (metadata) => {
    const res = await axios.get(`https://ipfs.io/ipfs/${metadata}`);
    return await fetchWhitelist(JSON.parse(res.data).seedDetails.whitelist);
}
export const parseName = async (metadata) => {
    const res = await axios.get(`https://ipfs.io/ipfs/${metadata}`);
    return JSON.parse(res.data).general.projectName;
}