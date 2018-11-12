import React, { Component } from 'react';
import moment from 'moment';
import { object } from 'prop-types';
import Web3 from 'web3';
import KittyCoreABI from '../contracts/KittyCoreABI.json';
import { CONTRACT_NAME, CONTRACT_ADDRESS } from '../config';

const KITTY_ALBUM = 'https://storage.googleapis.com/ck-kitty-image/0x06012c8cf97bead5deae237070f9587f8e7a266d';

class Browser extends Component {
  state = { error: null, kitty: null, contractResult: null, value: "" };

  async componentDidMount() {
    const web3 = new Web3(window.web3.currentProvider);
    // Initialize the contract instance
    const kittyContract = new web3.eth.Contract(
      KittyCoreABI, // import the contracts's ABI and use it here
      CONTRACT_ADDRESS,
    );
    // Add the contract to the drizzle store
    await this.context.drizzle.addContract({
      contractName: CONTRACT_NAME,
      web3Contract: kittyContract
    });
    // get a random kitty when the component mounts
    this.getRandomKitty();
  }

  // get the 
  getRandomKitty = async () => {
    const { methods: { totalSupply } } = this.context.drizzle.contracts[CONTRACT_NAME];
    const upperBound = await totalSupply().call();
    const randomKittyId = Math.floor(Math.random() * upperBound) + 1;
    this.getKitty({ id: randomKittyId });
  }

  setKitty = (id) => (error, contractResult) => {
    this.setState({ kitty: id, value: id, error, contractResult }, () => { console.log(this.state) });
  }

  // calls the contract method to get a kitty given the id or the currently entered value
  getKitty = ({ id }) => {
    // note [esb] simple ui does not handle errors
    try {
      const kittyId = id ? parseInt(id, 10) : parseInt(this.state.value, 10);
      const { methods: { getKitty } } = this.context.drizzle.contracts[CONTRACT_NAME];
      getKitty(kittyId).call(this.setKitty(kittyId));
    } catch (error) {
      console.error(error)
      this.setState({ error })
    }
  }

  keyPress = (e) => {
    if (e.keyCode === 13) this.getKitty(e.target.value);
  }
  // just update the user input
  update = ({ target: { value } }) => this.setState({ value });

  KittyPortrait = ({ id }) => {
    return <div className="kitty-portrait">
      {id ? <img src={`${KITTY_ALBUM}/${id}.png`} alt="[one cute kitty]" /> : null}
    </div>
  }
  KittyInfo = ({ kitty }) => {
    const { genes, generation, birthTime, sireId: dad, matronId: mom } = kitty || {
      genes: '',
      generation: '',
      birthTime: '',
      sireId: '',
      matronId: ''
    };
    return (
      <div className="kitty-info">
        <label>Genes</label>
        <span>{`${genes}`}</span>

        <label>Generation</label>
        <span>{`${generation}`}</span>

        <label>Born</label>
        <span>{`${moment.unix(birthTime).format("MM-DD-YYYY HH:mm")}`}</span>

        <label>Matron ID</label>
        <span>{`${dad}`}</span>

        <label>Sire ID</label>
        <span>{`${mom}`}</span>
      </div>
    );
  }
  Boundary = ({ info, children }) => {
    return (
      <div className="kitty-card">{info ?
        <label className="error-info">Problem encountered while fetching kitty:
        <span>{`${info}`}</span>
        </label>
        : null}
        {children}
      </div>
    );
  }
  render() {
    const { value, kitty, contractResult, error } = this.state;
    return (
      <div className="browser">
        <h1>
          Kitty Browser
        </h1>
        <section>
          <this.Boundary info={error ? error.message : null}>
            <this.KittyPortrait id={kitty} />
            <this.KittyInfo kitty={contractResult} />
          </this.Boundary>
          <label htmlFor="kitty-id" className="kitty-id-input">
            Identifier:
            <input id="kitty-id" onKeyDown={this.keyPress} value={value} onChange={this.update} />
          </label>
          <button onClick={this.getKitty}>fetch this kitty</button>
          <button onClick={this.getRandomKitty}>fetch random kitty</button>
        </section>

      </div>
    );
  }
}

Browser.contextTypes = {
  drizzle: object,
};

export default Browser;
