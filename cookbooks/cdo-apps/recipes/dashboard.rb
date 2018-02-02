::Chef::Recipe.send(:include, CdoApps)
setup_app 'dashboard'

Chef.event_handler do
  on :stream_output do |_stream, output, _options|
    Chef::Log.info output
  end
end
