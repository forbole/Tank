import Parcel, { AppId, IdentityId } from "@oasislabs/parcel"
import performance from 'perf_hooks'
import fs from 'fs'

//log files in ./log
const uploadLog = './log/upload.csv'
const downloadLog = './log/downlod.csv'
const computeLog = './log/compute.csv'

//https://steward.oasiscloud.io/apps/c9d5fe98-b4d7-4b46-850f-b7ceed7e6bed/join
const apiCreds = {
  // Client ID. Replace this with your service client ID, e.g. "C92EAFfH67w4bGkVMjihvkQ"
  clientId: "CH3NZkNNBLyU7b8ERaEWYuX",
  // Client key
  privateKey:{
    kty: "EC",
    d: "gU0zm3SKbEjJ1evZ0D1b-Dt2VZgXCY_oOIvy5ktmXYk",
    use: "sig",
    crv: "P-256",
    x: "4D8a3zvYLpEazIIxszCZ_RZ-bb6dhkymEjcsn6Huhn8",
    y: "FW_BE9VeKFlHAf0xPbZZvOBnBPXMXsqk5IYg67BF7oE",
    alg: "ES256"
},
} as const;

var JsonToArray = function(json)
{
  var str = JSON.stringify(json, null, 0);
  console.log(str)
	var ret = new Uint8Array(str.length);
	for (var i = 0; i < str.length; i++) {
		ret[i] = str.charCodeAt(i);
	}
	return ret
};

var binArrayToJson = function(binArray)
{
	var str = "";
	for (var i = 0; i < binArray.length; i++) {
		str += String.fromCharCode(parseInt(binArray[i]));
	}
	return JSON.parse(str)
}
/**
 * This upload the data that user want to save to Parcel
 * @param address User identity address
 * @param parsephase The entry that want to save
 * @return hash of that document stored in Parcel 
 */
async function uploads(address, parsephase) {
  const t0 = performance.performance.now()

  const parcel = new Parcel(apiCreds);
  const aliceIdentity = await parcel.getCurrentIdentity();
  /* 
  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
  const aliceIdentityAddress = Parcel.Identity.addressFromToken(
    await aliceConfig.tokenProvider.getToken(),
  );
  const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, config);
 */
  //need to get grant from steward app first
 /*  const bobIdentityAddress = new Parcel.Address(address); */
  //const bobIdentityAddress = new Parcel.Address("0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1");
  const data = JsonToArray(parsephase)
  const documentDetails = { title: 'Desmos Posts', tags: ['JSON'] };

  //const data = new TextEncoder().encode('The weather will be sunny tomorrow')
  const bobId = address as IdentityId; 
  const appId = apiCreds.clientId as AppId;
  const dataset = await parcel.uploadDocument(data, {
    details: documentDetails,
    owner: bobId,
    toApp: appId,
  }).finished;

  
  console.log(`Created document ${dataset.id} with owner ${dataset.owner}`);

  var t1 = performance.performance.now()
  console.log("Upload dataset from bob take" + (t1 - t0) + " milliseconds.")
  fs.appendFile(uploadLog, (t1 - t0) + "\n", function (err) {
    if (err) throw err;
    console.log("Saved to uploadLog")
  });

  
  console.log(
    `Created dataset with address ${dataset.id}\n`,
  );

  return dataset.id
}

/* docker run \  -v $PWD/test_workdir:/predict/test \
   appleno0610/testlabel:latest \
  /usr/bin/python3 compute.py /predict/test/data/in/intext.txt /predict/test/data/in/label.txt /predict/test/data/out/out.txt /predict/test/distilbart-mnli-12-1 */

/**
 * This pull all data history from client and compute that in a docker job
 * @param address User Identity Address
 * @returns output of the docker job
 */
async function compute(address) {
 /*  var t0 = performance.performance.now()
  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
  const aliceIdentityAddress = Parcel.Identity.addressFromToken(
    await aliceConfig.tokenProvider.getToken()
  );
  const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, config);
  const dispatcher = await Parcel.Dispatcher.connect(config.dispatcherAddress, aliceIdentity, config);
  
  const bobIdentityAddress = new Parcel.Address(address);
  //const bobIdentityAddress = new Parcel.Address("0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1");
  const bobIdentity = await Parcel.Identity.connect(bobIdentityAddress, aliceConfig);
  const bobDatasets = await bobIdentity.getOwnedDatasets();
  //const dataset = bobDatasets.pop();
  const datasets = bobDatasets.filter(dataset => dataset.metadata.title == "Desmos Posts");
  console.log(datasets.length)
  const inputDatasets = datasets.map(dataset => (
    { mountPath: dataset.owner.hex + "/" + dataset.address.hex + '.txt', address: dataset.address }
  ))
  console.log(inputDatasets)

  const jobRequest = {
    name: 'keyword_extraction',
    dockerImage: 'appleno0610/keyword_extraction:0.23',
    inputDatasets: inputDatasets,
    outputDatasets: [{ mountPath: 'output.json', owner: bobIdentity }],
    cmd: [
      "python", "extraction.py", '/parcel/data/in/', '/parcel/data/out/output.json'
    ]
  }
  //cannot submit job when the user is not authorised
  const jobId = await dispatcher.submitJob({ job: jobRequest });
  // #endregion snippet-submit-job
  var t1 = performance.performance.now()
  console.log(`Job ${Parcel.utils.encodeHex(jobId)} submitted. It takes ${t1 - t0} milliseconds to take dataset and submit job`);


  // Wait for job completion.
  const job = await dispatcher.getCompletedJobInfo(jobId);
  if (job.status instanceof Parcel.JobCompletionStatus.Success) {
    console.log('Job completed successfully!');
  } else {
    await dispatcher.getJobInfo(jobId)
    const str = await dispatcher.debugString()
    console.log('Job failed!', job.info);
  }
  var t2 = performance.performance.now()
  console.log(`Job ${Parcel.utils.encodeHex(jobId)} finished. It takes ${t2 - t1} milliseconds to compute and take total ${t2 - t0} milliseconds`);

  let data
  if (job.outputs[0]) {
    const output = await Parcel.Dataset.connect(job.outputs[0].address, aliceIdentity, aliceConfig);
    const datastream = output.download();
    data = await readableToString(datastream);
  }
  const res = JSON.parse(data)
  fs.appendFile(computeLog,`${(t1 - t0)},${t2 - t1},${t2 - t0} \n`, function (err) {
    if (err) throw err;
    console.log("Saved to computeLog")
  });

  return res */

}

async function getSharedDataset() {
/*   const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
  const aliceIdentityAddress = Parcel.Identity.addressFromToken(
    await aliceConfig.tokenProvider.getToken(),
  );
  const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, config);
  const dispatcher = await Parcel.Dispatcher.connect(config.dispatcherAddress, aliceIdentity, config);
  const aliceDatasets = await aliceIdentity.getSharedDatasets();
  const datasets = aliceDatasets.filter(dataset => dataset.metadata.title == "Interested posts");
  const inputDatasets = datasets.map(dataset =>(
    { mountPath: dataset.owner.hex+"/"+dataset.address.hex+'.json', address: dataset.address }
  ))
  return inputDatasets */
}

async function buildCollaborativeModel() {
/*   const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
  const aliceIdentityAddress = Parcel.Identity.addressFromToken(
    await aliceConfig.tokenProvider.getToken(),
  );
  const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, config);
  const dispatcher = await Parcel.Dispatcher.connect(config.dispatcherAddress, aliceIdentity, config);
  const aliceDatasets = await aliceIdentity.getSharedDatasets();
  const datasets = aliceDatasets.filter(dataset => dataset.metadata.title == "Interested posts");
  const inputDatasets = datasets.map(dataset =>(
    { mountPath: dataset.owner.hex+"/"+dataset.address.hex+'.json', address: dataset.address }
  ))
  
  var uniqueOwner: { mountPath: string; owner: Parcel.Identity }[]
  for (var i = 0; i < datasets.length; i++){
    if (uniqueOwner.find(element=> element.mountPath===datasets[i].owner.hex)!=undefined) {
      const address=datasets[i].owner.hex
      const bobIdentityAddress = new Parcel.Address(address);
      const bobIdentity = await Parcel.Identity.connect(bobIdentityAddress, aliceConfig);
      uniqueOwner.push({mountPath:address + ".json", owner: bobIdentity})
    }
  }

  uniqueOwner.push({mountPath:"mvae_weights.hdf5 ", owner: aliceIdentity})

  const jobRequest = {
    name: 'social-media-collaborative-filtering',
    dockerImage: 'appleno0610/collaborative:0.1',
    inputDatasets: inputDatasets,
    outputDatasets: uniqueOwner,
    cmd: [
      'python3',
      'collaborative.py'
    ]
  }

  const jobId = await dispatcher.submitJob({ job: jobRequest });
  // #endregion snippet-submit-job
    console.log(`Job ${Parcel.utils.encodeHex(jobId)} submitted.`);

    // Wait for job completion.
    const job = await dispatcher.getCompletedJobInfo(jobId);
    if (job.status instanceof Parcel.JobCompletionStatus.Success) {
        console.log('Job completed successfully!');
    } else {
      await dispatcher.getJobInfo(jobId)
      const str = await dispatcher.debugString()
      console.log('Job failed!',job.info);
    }
  
  return job.status; */

}

async function getCollaborativeResultSingleUser(identity: string) {
 /*  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
  const aliceIdentityAddress = Parcel.Identity.addressFromToken(
    await aliceConfig.tokenProvider.getToken(),
  );
  const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, config);
  //get all identity address
  const bobIdentityAddress = new Parcel.Address(identity);
  const bobIdentity = await Parcel.Identity.connect(bobIdentityAddress,aliceConfig);
  const bobDatasets = await bobIdentity.getOwnedDatasets();
  const result = bobDatasets.find(dataset =>
                       dataset.metadata.title.includes("social-media-collaborative-filtering")
    && ((new Date().getTime() - dataset.creationTimestamp.getTime()) < 60 * 60 * 1000 * 2))
  if (result == undefined) {
    return "oops"
  }

  var datasetByAlice = await Parcel.Dataset.connect(result.address, aliceIdentity, aliceConfig);
  const streamFinished = require('util').promisify(require('stream').finished);
  const datastream = datasetByAlice.download();
  let chunks;
  datastream.on('readable',() => {
    let chunk;
    while (null !== (chunk = datastream.read())) {
      chunks.push(chunk);
    }
  })
  datastream.on('end', () => {
    const content = chunks.join('');
    return content
  }); */
}


async function getUserData(identity: string, type: string) {
  /* var t0 = performance.performance.now()
  const writeFile='./output.json'
  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
  const aliceIdentityAddress = Parcel.Identity.addressFromToken(
    await aliceConfig.tokenProvider.getToken(),
  );
  const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, config);
  //get all identity address
  const bobIdentityAddress = new Parcel.Address(identity);
  const bobIdentity = await Parcel.Identity.connect(bobIdentityAddress,aliceConfig);
  const bobDatasets = await bobIdentity.getOwnedDatasets();
  const dataset = bobDatasets.find(dataset =>
    dataset.metadata.title.includes(type)
  && ((new Date().getTime() - dataset.creationTimestamp.getTime()) < 60 * 60 * 1000 * 2))

  if (dataset == undefined) {
    const data = await compute(identity) 
    return data
  }
  var datasetByAlice = await Parcel.Dataset.connect(dataset.address, aliceIdentity, aliceConfig);
  const datastream = datasetByAlice.download();
  const data = await readableToString(datastream);
  const returndata = JSON.parse(data.toString())
  var t1 = performance.performance.now()
  console.log("Download dataset for bob take" + (t1 - t0) + " milliseconds.")

  fs.appendFile(downloadLog,`${(t1 - t0)} \n`, function (err) {
    if (err) throw err;
    console.log("Saved to computeLog")
  });
  return returndata
 */
  // console.log("outer "+data)
  // return data;
}

async function readableToString(readable) {
  readable.setEncoding('utf-8')
  return new Promise((resolve, reject) => {
    let data = '';
    readable.on('data', function (chunk) {
      data += chunk;
    });
    readable.on('end', function () {
      resolve(data);
    });
    readable.on('error', function (err) {
      reject(err);
    });
  });
}

export {
  uploads,
  compute,
  getSharedDataset,
  buildCollaborativeModel,
  getUserData
}

/* async function main() {
  console.log("start");
  await compute("0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1");
}

main()
    .then(() => console.log('All done!'))
    .catch((err) => {
        console.log(`Error in main(): ${err.stack || JSON.stringify(err)}`);
        process.exitCode = 1;
    });
 */