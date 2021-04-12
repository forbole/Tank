import * as Parcel from '@oasislabs/parcel-sdk';
require('dotenv').config("../.env");
import performance from 'perf_hooks'


//https://steward.oasiscloud.io/apps/c9d5fe98-b4d7-4b46-850f-b7ceed7e6bed/join
const configParams = Parcel.Config.paramsFromEnv();
const config = new Parcel.Config(configParams);


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

  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
  const aliceIdentityAddress = Parcel.Identity.addressFromToken(
    await aliceConfig.tokenProvider.getToken(),
  );
  const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, config);

  //need to get grant from steward app first
  const bobIdentityAddress = new Parcel.Address(address);
  //const bobIdentityAddress = new Parcel.Address("0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1");

  const datasetMetadata = {
    title: "Desmos Posts",
    metadataUrl: 'http://s3-us-west-2.amazonaws.com/my_first_metadata.json',
  }

  const data= JsonToArray(parsephase)
  //const data = new TextEncoder().encode('The weather will be sunny tomorrow')
  console.log('Uploading data for Bob');
  const dataset = await Parcel.Dataset.upload(
    data,
    datasetMetadata,
    // The dataset is uploaded for Bob...
    await Parcel.Identity.connect(bobIdentityAddress, aliceConfig),
    // ...with Alice's credentials being used to do the upload...
    aliceConfig,
    {
      // ...and Alice is flagged as the dataset's creator.
      creator: aliceIdentity,
    },
  );
  var t1 = performance.performance.now()
  console.log("Upload dataset from bob take"+ (t1 - t0) + " milliseconds.")
  
  console.log(
    `Created dataset with address ${dataset.address} and uploaded to ${dataset.metadata.dataUrl}\n`,
  );

  return dataset.address.hex
}

/**
 * This function return all the history dasta that the user has been stored
 * @param identity User Identity Address
 * @param writeFile The output file 
 */
async function download(identity = "0xddbe5ae7e8bf58f24f8253fe9d3473392c61a8f1", writeFile = './docker/test_workdir/data/in/intext.txt') {
  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
  const aliceIdentityAddress = Parcel.Identity.addressFromToken(
    await aliceConfig.tokenProvider.getToken(),
  );
  const aliceIdentity = await Parcel.Identity.connect(aliceIdentityAddress, config);
  //get all identity address
  const bobIdentityAddress = new Parcel.Address(identity);
  const bobIdentity = await Parcel.Identity.connect(bobIdentityAddress,aliceConfig);
  const bobDatasets = await bobIdentity.getOwnedDatasets();
  var datasets = aliceIdentity.getOwnedDatasets();
  //const writeFile = '../docker/test_workdir/data/in';

    bobDatasets.forEach(
      async function (value) {
        var datasetByAlice = await Parcel.Dataset.connect(value.address, aliceIdentity, aliceConfig);
        const streamFinished = require('util').promisify(require('stream').finished);
        try {
          const secretDataStream = datasetByAlice.download();
      
          const secretDatasetWriter = secretDataStream.pipe(
          require('fs').createWriteStream(writeFile),
          );
        await streamFinished(secretDatasetWriter);
        console.log(
          `\nDataset ${datasetByAlice.address.hex} has been downloaded to ${writeFile}`,
        );
        } catch (e) {
      throw new Error(`Failed to download dataset at ${datasetByAlice.address.hex}`);
    }
      }
  )
    
const secretDataByAlice = require('fs').readFileSync(writeFile).toString();
  console.log(`Here's the data: ${secretDataByAlice}`);
  return secretDataByAlice;
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
  var t0 = performance.performance.now()
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
    { mountPath: dataset.owner.hex+"/"+dataset.address.hex+'.txt', address: dataset.address }
  ))
  console.log(inputDatasets)

  const jobRequest = {
    name: 'keyword_extraction',
    dockerImage: 'appleno0610/keyword_extraction:0.23',
    inputDatasets: inputDatasets,
    outputDatasets: [{ mountPath: 'output.json', owner: bobIdentity }],
    cmd: [
      "python", "extraction.py" ,'/parcel/data/in/' , '/parcel/data/out/output.json'
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
  console.log(res)
  return res

}

async function getSharedDataset() {
  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
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
  return inputDatasets
}

async function buildCollaborativeModel() {
  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
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
  
  return job.status;

}

async function getCollaborativeResultSingleUser(identity: string) {
  const aliceConfig = new Parcel.Config(Parcel.Config.paramsFromEnv());
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
  });
}


async function getUserData(identity: string, type: string) {
  var t0 = performance.performance.now()
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
    return type+"Not found"
  }
  var datasetByAlice = await Parcel.Dataset.connect(dataset.address, aliceIdentity, aliceConfig);
  const datastream = datasetByAlice.download();
  const data = await readableToString(datastream);
  const returndata = JSON.parse(data.toString())
  var t1 = performance.performance.now()
  console.log("Download dataset for bob take" + (t1 - t0) + " milliseconds.")

  return data

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
  download,
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