var axios = require("axios");

const gql = async (arg) => {
  var data = JSON.stringify({
    query: `mutation{
    ${arg}
  }`,
    variables: {},
  });
  // console.log(data);

  var config = {
    method: "post",
    url: "http://172.17.0.1:5500/graphql",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  try {
    await axios(config);
    // console.log("GQL => ", gqlResponse.data.data);
    return true;
  } catch (error) {
    console.log("GQL ERROR!", error);
    return true;
  }
};

module.exports = gql;
