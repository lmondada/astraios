{
  description = "Build Envoy Docker Image serving frontend + grpc-web";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/*.tar.gz";
    frontend.url = "path:./frontend"; # Adjust the path to point to the location of your frontend flake
  };

  outputs = { self, nixpkgs, frontend }: 
  let
    # Helpers for producing system-specific outputs
    supportedSystems = [ "x86_64-linux" "aarch64-darwin" ];
    forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
      pkgs = import nixpkgs { inherit system; };
    });
  in {
    packages = forEachSupportedSystem ({ pkgs }: rec {
      default = pkgs.dockerTools.buildImage {
        name = "@astraios/envoyproxy";
        tag = "latest";
        contents = [ frontend.packages.x86_64-linux.default ];
        config = {
          Cmd = [ "-c /etc/envoy/envoy.yaml" "-l trace" "--log-path /tmp/envoy_info.log" ];
          Entrypoint = [ "/usr/local/bin/envoy" ];
          # ExposedPorts = { "80/tcp" = {}; };
          # Volumes = { "/etc/envoy" = {}; };
        };
      };
    });
  };
}