function getArchitectures(): { name: string; display_name: string }[] {
  return [
    {
      name: "",
      display_name: "All",
    },
    {
      name: "amd64",
      display_name: "AMD64",
    },
    {
      name: "arm64",
      display_name: "ARM64",
    },
    {
      name: "armhf",
      display_name: "ARMHF",
    },
    {
      name: "i386",
      display_name: "I386",
    },
    {
      name: "ppc64el",
      display_name: "PPC64EL",
    },
    {
      name: "s390x",
      display_name: "S390X",
    },
    {
      name: "riscv64",
      display_name: "RISC-V",
    },
  ];
}

export default getArchitectures;
