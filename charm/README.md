# The Charm for the snapcraft.io website

This charm was created using the [PaaS App Charmer](https://canonical-12-factor-app-support.readthedocs-hosted.com/latest/)

## Local development

To work on this charm locally, you first need to set up an environment, follow [this section](https://juju.is/docs/sdk/write-your-first-kubernetes-charm-for-a-flask-app#heading--set-things-up) of the tutorial.

Then, you can run the following command to pack and upload the rock:

```bash
rockcraft pack
rockcraft.skopeo --insecure-policy copy --dest-tls-verify=false oci-archive:snapcraft-io*.rock docker://localhost:32000/snapcraft-io:1
```

This will pack the application into a [rock](https://documentation.ubuntu.com/rockcraft/en/latest/explanation/rocks/) (OCI image) and upload it to the local registry.

You can deploy the charm locally with:

```bash
cd charm
charmcraft fetch-libs
charmcraft pack
juju deploy ./*.charm --resource flask-app-image=localhost:32000/snapcraft-io:1
```

This will deploy the charm with the rock image you just uploaded attached as a resource.

Once `juju status` reports the charm as `active`, you can test the webserver:

```bash
curl {IP_OF_SNAPCRAFT_IO_UNIT}:8000
```

To connect using a browser, the easiest way is to integrate with `nginx-ingress-integrator`:

```bash
juju deploy nginx-ingress-integrator --trust
juju config nginx-ingress-integrator service-hostname=snapcraft.local path-routes=/
juju integrate nginx-ingress-integrator snapcraft-io
```

You can then add `snapcraft.local` to your `/etc/hosts` file with the IP of the multipass vm:

```bash
multipass ls # Get the IP of the VM
echo "{IP_OF_VM} snapcraft.local" | sudo tee -a /etc/hosts
```

> Note: login will not work using this setup, if you'd like to access publisher pages, change the domain to `staging.snapcraft.io`, but make sure to remove the line from `/etc/hosts` after you're done.


## Design Decisions:

- To keep the codebase clean and charm libraries updated, they are only fetched before packing the charm in the [GitHub Actions workflow](https://github.com/canonical/webteam-devops/blob/7041da8810758715a73e1f8be67b2e68f0e1d58f/.github/workflows/deploy.yaml#L97).
- As all our work is open source, the charm is publicly available on [snapcraft](https://charmhub.io/snapcraft-io), the rock image is also included as a resource. This significantly simplifies deployment.
