{
  description = "alexpearce.me website";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.simpleFlake {
      inherit self nixpkgs;
      name = "alexpearce-me";
      shell = { pkgs ? nixpkgs }:
        pkgs.mkShell {
          buildInputs = [ pkgs.nodejs ];
        };
    };
}
