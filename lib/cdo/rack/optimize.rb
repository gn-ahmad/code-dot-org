require 'cdo/optimizer'
require 'rack/cache'

# Rack middleware that applies an optimizing filter pass on response content.
module Rack
  class Optimize
    CDO_OPTIMIZE = 'X-CDO-Optimize'.freeze

    def initialize(app, options = {})
      @app = app
      @content_types = options.delete(:content_types) || Cdo::Optimizer::MIME_TYPES.values.flatten
    end

    def call(env)
      status, headers, body = @app.call(env)
      headers = Utils::HeaderHash.new(headers)
      unless should_process?(env, status, headers, body)
        return [status, headers, body]
      end

      request = Rack::Request.new(env)

      # Read the response body into a string.
      if body.respond_to?(:read)
        content = body.read
      else
        content = ''
        body.each {|x| content << x}
      end
      body.close if body.respond_to? :close

      content_type = headers['Content-Type'] || 'application/octet-stream'
      optimized_content = Cdo::Optimizer.optimize(content, content_type, request.url)

      # If the optimizer returns nil, the optimization is still pending.
      if optimized_content.nil?
        optimized_content = content

        # Reduce the `s-maxage` cache-control header, so un-optimized content is only stored briefly in proxy caches.
        # Browsers will still hold the resource for whatever cache lifetime originally set.
        response = Rack::Cache::Response.new(status, headers, body)
        response.shared_max_age = 10
        # Remove Last-Modified header so proxy caches get the updated resource when revalidating.
        response.headers.delete('Last-Modified')
        response.headers[CDO_OPTIMIZE] = 'miss'
        headers = response.headers
      else
        headers[CDO_OPTIMIZE] = 'hit'
      end

      # Update content-length after transform.
      headers['content-length'] = optimized_content.bytesize.to_s
      response_body = [optimized_content]

      [status, headers, response_body]
    end

    def should_process?(env, status, headers, body)
      # Skip empty entity body responses.
      return false if Utils::STATUS_WITH_NO_ENTITY_BODY.include?(status)

      # Skip if content-type header doesn't include one of allowed types.
      if @content_types
        content_type = headers['Content-Type'] || 'application/octet-stream'
        return false unless content_type.include_one_of?(@content_types)
      end

      return false unless Gatekeeper.allows('optimize', default: true)

      # Skip no-transform or uncacheable responses.
      return false if headers['Cache-Control'].to_s =~ /\b(no-transform|private|no-store|max-age=0)\b/

      # Don't optimize twice.
      return false if headers[CDO_OPTIMIZE]
      true
    end
  end
end
