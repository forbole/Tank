/**
 * @fileoverview gRPC-Web generated client stub for routeguide
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck



const grpc = {};
grpc.web = require('grpc-web');

const proto = {};
proto.routeguide = require('./recommend_pb.js');

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.routeguide.ParcelParserClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?Object} options
 * @constructor
 * @struct
 * @final
 */
proto.routeguide.ParcelParserPromiseClient =
    function(hostname, credentials, options) {
  if (!options) options = {};
  options['format'] = 'text';

  /**
   * @private @const {!grpc.web.GrpcWebClientBase} The client
   */
  this.client_ = new grpc.web.GrpcWebClientBase(options);

  /**
   * @private @const {string} The hostname
   */
  this.hostname_ = hostname;

};


/**
 * @const
 * @type {!grpc.web.MethodDescriptor<
 *   !proto.routeguide.UserInfo,
 *   !proto.routeguide.Words>}
 */
const methodDescriptor_ParcelParser_GetRecommended = new grpc.web.MethodDescriptor(
  '/routeguide.ParcelParser/GetRecommended',
  grpc.web.MethodType.SERVER_STREAMING,
  proto.routeguide.UserInfo,
  proto.routeguide.Words,
  /**
   * @param {!proto.routeguide.UserInfo} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.routeguide.Words.deserializeBinary
);


/**
 * @const
 * @type {!grpc.web.AbstractClientBase.MethodInfo<
 *   !proto.routeguide.UserInfo,
 *   !proto.routeguide.Words>}
 */
const methodInfo_ParcelParser_GetRecommended = new grpc.web.AbstractClientBase.MethodInfo(
  proto.routeguide.Words,
  /**
   * @param {!proto.routeguide.UserInfo} request
   * @return {!Uint8Array}
   */
  function(request) {
    return request.serializeBinary();
  },
  proto.routeguide.Words.deserializeBinary
);


/**
 * @param {!proto.routeguide.UserInfo} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.routeguide.Words>}
 *     The XHR Node Readable Stream
 */
proto.routeguide.ParcelParserClient.prototype.getRecommended =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/routeguide.ParcelParser/GetRecommended',
      request,
      metadata || {},
      methodDescriptor_ParcelParser_GetRecommended);
};


/**
 * @param {!proto.routeguide.UserInfo} request The request proto
 * @param {?Object<string, string>} metadata User defined
 *     call metadata
 * @return {!grpc.web.ClientReadableStream<!proto.routeguide.Words>}
 *     The XHR Node Readable Stream
 */
proto.routeguide.ParcelParserPromiseClient.prototype.getRecommended =
    function(request, metadata) {
  return this.client_.serverStreaming(this.hostname_ +
      '/routeguide.ParcelParser/GetRecommended',
      request,
      metadata || {},
      methodDescriptor_ParcelParser_GetRecommended);
};


module.exports = proto.routeguide;

