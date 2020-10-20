App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 10000,
  tokenPrice1: 2000000000000000,
  tokensSold: 0,
  tokensAvailable: 400,

  init: function() {
	  // Modern DApp Browsers
if (window.ethereum) {
   web3 = new Web3(window.ethereum);
   try { 
      window.ethereum.enable().then(function() {
		 
          // User has allowed account access to DApp...
      });
   } catch(e) {
      // User has denied account access to DApp...
   }
}
// Legacy DApp Browsers
else if (window.web3) {
    web3 = new Web3(web3.currentProvider);
	
}
// Non-DApp Browsers
else {
    alert('You have to install MetaMask !');
	
}
  
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("DappTokenSale.json", function(dappTokenSale) {
      App.contracts.DappTokenSale = TruffleContract(dappTokenSale);
      App.contracts.DappTokenSale.setProvider(App.web3Provider);
      App.contracts.DappTokenSale.deployed().then(function(dappTokenSale) {
        console.log("Dapp Token Sale Address:", dappTokenSale.address);
      });
    }).done(function() {
      $.getJSON("DaiToken.json", function(dappToken) {
        App.contracts.DaiToken = TruffleContract(dappToken);
        App.contracts.DaiToken.setProvider(App.web3Provider);
        App.contracts.DaiToken.deployed().then(function(dappToken) {
          console.log("Dapp Token Address:", dappToken.address);
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#accountAddress').html( account);
      }
    })

    // Load token sale contract
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      dappTokenSaleInstance = instance;
      return dappTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
		var tokenPrice1 =2000000000000000;
      App.tokenPrice = tokenPrice1;
      $('.token-price1').html(web3.fromWei(App.tokenPrice, "ether").toString());
      return dappTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toString();
      $('.tokens-sold').html(web3.fromWei(App.tokensSold,"ether").toString());
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
       App.contracts.DaiToken.deployed().then(function(instance) {
        dappTokenInstance = instance;
        return dappTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.dapp-balance').html(web3.fromWei(balance.toNumber(),"ether"));
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

 endSale: function() {
    $('#content').hide();
    $('#loader').show();
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      return instance.endSale();
    }).then(function(result) {
      console.log("Tokens bosss...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  },
  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens1 = $('#numberOfTokens').val();
	var number = numberOfTokens1 * 1000000000000000000;
	var numberOfTokens = $('#numberOfTokens').val()
	var tokenPrice1 = 2000000000000000;
    App.contracts.DappTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(number,{
        from: App.account,
        value: numberOfTokens * tokenPrice1,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  }
  
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});
