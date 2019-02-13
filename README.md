# loconnect-custom-tool-sample
This is a sample custom tool application where a financial institution created a custom tool that allowed its Loan Officer to search for account information of their existing borrowers through their external account system and populate accounts of the borrower/co-borrower within the custom tool. User can then select and add the assets directly into LOConnect assets screen.


### Setup
Run the following commands after cloning the repo
```
    npm install --> installs the dependencies
    npm start --> Starts a live server that runs the app locally
```

#### Getting objects to work with
```
    if (elli && elli.script) { // This would be true if the package (em-ssf-guest) is installed
            elli.script.guest.create('', document.head);
            // loanChangeEvent will be fired everytime you call setField function
            elli.script.subscribe('loan', 'change', loanChangeEvent);
    } 
```

Get loan & auth object like:
```
    const authObj = await elli.script.getObject('auth');
    const loanObj = await elli.script.getObject('loan');
```

You can then call methods exposed on these objects:
For example:
``` 
    authObj.getUser(); OR
    loanObj.all();
```

### Custom Tool Implementation Guide
For more information on how to implement custom tool in LO Connect, please click on the link below:

https://help.elliemae.com/documentation/developer-connect/documents/LOConnect_CustomTools.pdf
