# Look for a VPC already tagged with this project's Name.
# Returns empty (not an error) if none exists yet.
data "aws_vpcs" "existing" {
  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

locals {
  vpc_already_exists = length(data.aws_vpcs.existing.ids) > 0
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.8"

  count = local.vpc_already_exists ? 0 : 1   # <-- skip creating if it already exists

  name = "${var.project_name}-${var.environment}-vpc"
  cidr = var.vpc_cidr
  azs             = var.azs
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true
  public_subnet_tags = {
    "kubernetes.io/role/elb"                              = "1"
    "kubernetes.io/cluster/${var.project_name}-${var.environment}-eks" = "shared"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"                     = "1"
    "kubernetes.io/cluster/${var.project_name}-${var.environment}-eks" = "shared"
  }
}
