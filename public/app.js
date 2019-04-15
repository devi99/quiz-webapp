/* let routes = {
    '/': homepage,
    '/portfolio': portfolio,
    '/work': work,
    '/contact': contact,
  }; */

  (function () {
    var fullPath = window.location.pathname.substr(window.location.pathname.indexOf('/') + 1); // and split it into an array

    var pathArr = fullPath.split('/'); // check what is being requested

    console.log(pathArr); // This is the entry point of every page hit
})();

window.onpopstate = () => {
    console.log("onpopstate");
  }