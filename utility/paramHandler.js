SSM = require("@aws-sdk/client-ssm");
const rds_parameter = "/n11580062/api-dns";
const client = new SSM.SSMClient({ region: "ap-southeast-2" });

async function getRdsAddress() {
  try {
    response = await client.send(
      new SSM.GetParameterCommand({
        Name: rds_parameter,
      })
    );

    //console.log(response.Parameter.Value);

    return response.Parameter.Value;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getRdsAddress };
