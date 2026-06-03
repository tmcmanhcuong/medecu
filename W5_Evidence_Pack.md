# Evidence Pack W5: The Network Fortress

## Trần Mạnh Cường

---

## Cover

| Thông tin | Chi tiết |
| --- | --- |
| **Team** | XBrain_Group10 |
| **Tên thành viên** | Trần Mạnh Cường |
| **Tuần** | W5 - The Network Fortress (1–4 tháng 6, 2026) |
| **Deadline** | Thứ tư 04-06-2026 |
| **Link Repository** | https://github.com/tmcmanhcuong/medecu.git |
| **Evidence Pack tuần trước** | https://github.com/huyjaky/w4aws |
| **Ngày tạo** | 02-06-2026 |

---

## 1. Application Recap & Reflection

### Kiến trúc hiện tại

**Mô tả ngắn ứng dụng:**

- Tên ứng dụng: \[Ứng dụng AI chatbot\]
- Stack công nghệ: FastAPI, PostgreSQL
- Dịch vụ AI được tích hợp: Amazon Bedrock (Knowledge Base, Bedrock Agent, AWS Nova)
- Lớp lưu trữ file: Amazon EFS (medecu-efs)
- Cơ sở dữ liệu: RDS PostgreSQL (medecu-posgres)
- Backup được quản lý bởi: AWS Backup

### Ứng dụng chạy end-to-end (Live Demo)

**Action đại diện chứng minh app hoạt động:**

![image](public/app-activation.png)**Kiến trúc hệ thống trên cloud:**

![image](https://github.com/user-attachments/assets/51687d47-757b-495e-9f59-2ae93d5412e5)Link to diagram: https://app.diagrams.net/#G1uAov8ZokNK1LBo_zqMDtdrT4d8BFUOMf#%7B%22pageId%22%3A%22_wFuGsi9mvh8PrvmbIV1%22%7D

---

## 2. MH1 — Multi-VPC Connectivity

### Connectivity Decision: Justified Single-VPC with Multi-AZ Enhancement

**Justification cho Single-VPC:**

1. **Đơn giản hóa kiến trúc:** Ứng dụng chatbot là single-tenant SaaS không cần network isolation cấp VPC. Tất cả components (web frontend, LLM backend, database, embedding store) thuộc về cùng một ứng dụng logic.

2. **Cost-effective:** Single-VPC không cần Transit Gateway ($0.05/hour = $36/month) hay VPC peering management overhead. VPC charge vẫn flat rate $0.07/day cho single VPC.

3. **Latency thấp:** Tất cả tầng chạy cùng VPC → không có inter-VPC latency. Quan trọng cho real-time chat response (target latency &lt; 500ms từ user query tới bot answer).

4. **Easy troubleshooting:** VPC Flow Logs từ một VPC duy nhất dễ analyze hơn. Khi user báo "chatbot slow", có thể trace flow trên một VPC thay vì phải check routing giữa nhiều VPC.

5. **Không có compliance requirement:** Chatbot application không cần comply PCI-DSS (không xử lý payment cards), HIPAA (không xử lý health data), hay bất kỳ regulation nào đòi hỏi network isolation cấp VPC.

**Multi-AZ Enhancement for High Availability**:Tất cả subnet tiers được mở rộng sang **Multi-AZ** (ap-southeast-1a và ap-southeast-1b):

**Khi nào sẽ trigger Multi-VPC transition:**

1. **Multi-region deployment:** Khi mở rộng sang Singapore, Tokyo, hoặc region khác → sẽ cần VPC riêng per region + Transit Gateway global hub

2. **Separate staging/production:** Khi team scale và cần strict network isolation giữa prod (sensitive data) vs staging (test data) → sẽ tách thành VPC riêng

3. **Third-party chatbot integration:** Khi integrate với partner APIs (Slack bot marketplace, Teams integration) → sẽ cần VPC peering với partner infrastructure

4. **Compliance expansion:** Nếu sau này support healthcare/financial domain → HIPAA/PCI-DSS → sẽ cần dedicated VPC per compliance tier

5. Tổng quan kiến trúc VPC Hệ thống được triển khai trên một VPC duy nhất với tên medecu-vpc. Kiến trúc mạng được thiết kế theo mô hình phân tầng nhằm tách biệt các thành phần public, private (ECS/EFS), và database để tăng cường bảo mật và khả năng quản lý traffic.

a) Thông tin VPC:
- Tên VPC: `medecu-vpc`
- Mô hình: Single VPC Architecture
- Triển khai: Multi-AZ
- Region: ap-southeast-1

![image](./public/vpc.png)

b) Thiết kế Subnet:
Hệ thống sử dụng tổng cộng 6 subnet hoạt động, được phân bổ trên 2 Availability Zone:

- ap-southeast-1a
- ap-southeast-1b

Mỗi AZ bao gồm:

- Public Subnet Dùng cho Application Load Balancer (ALB) và NAT Gateway:

  - `medecu-public-a` - CIDR: `10.0.1.0/24` (AZ-a)
  - `medecu-public-b` - CIDR: `10.0.2.0/24` (AZ-b)

- Private Subnet Dùng cho ECS/Fargate tasks và EFS Mount Targets:

  - `medecu-ecs-a` - CIDR: `10.0.3.0/24` (AZ-a)
  - `medecu-ecs-b` - CIDR: `10.0.4.0/24` (AZ-b)

- Database Subnet Dùng cho Amazon RDS PostgreSQL:

  - `medecu-rds-a` - CIDR: `10.0.5.0/24` (AZ-a)
  - `medecu-rds-b` - CIDR: `10.0.6.0/24` (AZ-b)

c) Route Tables:
Hệ thống sử dụng 3 route table riêng biệt để quản lý traffic cho từng loại subnet:

- **Public Route Table:** `medecu-rt-public`

  ![image](./public/medecu-rt-public.png)

  *Chức năng:* Định tuyến internet outbound traffic (`0.0.0.0/0`) trực tiếp thông qua Internet Gateway (`medecu-igw`).

- **Private Route Table:** `medecu-rt-ecs`

  ![image](./public/medecu-rt-ecs.png)

  *Chức năng:* Chuyển toàn bộ outbound traffic (`0.0.0.0/0`) từ các Private App Subnet tới NAT Gateway (`medecu-natgw`) để ECS tasks kết nối an toàn ra các API/dịch vụ ngoài (như S3, Bedrock).

- **Database Route Table:** `medecu-rt-database`

  ![image](./public/medecu-rt-db.png)

  *Chức năng:* Tách biệt hoàn toàn traffic database khỏi public network (không cấu hình route outbound `0.0.0.0/0`), chỉ cho phép định tuyến nội bộ (local) trong VPC để đảm bảo an toàn bảo mật dữ liệu.

2. Network Connectivity

Hệ thống sử dụng:

- Internet Gateway

  - medecu-igw

    ![image](https://github.com/user-attachments/assets/a3f5b7b2-6ffb-4e2d-b707-518255109516)Chức năng:

  - Kết nối public subnet với Internet.

- NAT Gateway

  - `medecu-natgw`

    ![image](https://github.com/user-attachments/assets/d64881f0-4fc4-41b3-ae88-3a7e0c4494eb)Chức năng:

  - Cho phép private subnet truy cập Internet outbound mà không expose trực tiếp ra public Internet.

5. Multi-AZ Architecture

- Kiến trúc được triển khai trên 2 Availability Zone nhằm:
- Tăng tính sẵn sàng (High Availability)
- Đảm bảo khả năng chịu lỗi (Fault Tolerance)
- Giảm downtime khi một AZ gặp sự cố
- Phân phối workload hiệu quả hơn

6. Flow logs

a) VPC Flow Logs

Để giám sát và phân tích lưu lượng mạng trong hệ thống, VPC đã được cấu hình Flow Logs nhằm ghi nhận toàn bộ network traffic đi vào và đi ra khỏi VPC. Flow Logs giúp:

- Theo dõi traffic giữa các subnet

- Phân tích network connectivity

- Phát hiện traffic bất thường

- Hỗ trợ troubleshooting và security monitoring

  ![image](https://github.com/user-attachments/assets/5fc6ed81-87a6-4465-ba0d-2e7204777da0)

**Screenshot - VPC Flow Logs trong CloudWatch:**

![image](https://github.com/user-attachments/assets/afc3adc9-119c-43a9-a882-52bece877e18)\## 3. MH2 — Network Security Hardening (Bảo mật mạng & Cấu hình SG+NACL)

## Lựa chọn Path

### Path đã chọn:

☑ Path B — Security Groups & Network ACLs Hardening (Kiểm soát truy cập mạng nghiêm ngặt ở cấp độ Subnet và Instance)

> [!NOTE] 💡
> **Lưu ý về AWS Network Firewall ở tài khoản Free Tier:**
> Ban đầu em có định hướng triển khai Path A — AWS Network Firewall. Tuy nhiên, do giới hạn tài khoản AWS Free Tier / Sandbox hiện tại (gặp lỗi thiếu đăng ký dịch vụ - Subscription Required / Access Denied), em đã chuyển sang phương án bảo mật tối ưu theo Path B — Security Groups & Network ACLs Hardening.

Minh chứng lỗi không sử dụng được Network Firewall ở tài khoản Free Tier:

![image](./public/network-firewall-error.png)

---

# a) Architecture Overview

Hệ thống được thiết kế theo mô hình bảo mật nhiều tầng (Defense in Depth) trực tiếp trên VPC bằng cách kết hợp chặt chẽ Security Groups và Network ACLs.

Toàn bộ outbound traffic từ private subnet được chuyển hướng trực tiếp qua NAT Gateway ra Internet, nhưng được lọc nghiêm ngặt ngay từ cổng ra của container và ở cấp độ Subnet nhằm bảo vệ an toàn cho hệ thống.

## Traffic Flow

```text
ECS Container
→ Security Group (Lọc Port & IP nguồn/đích theo Least Privilege)
→ Subnet NACL (Lọc Outbound/Inbound subnet)
→ NAT Gateway
→ Internet
```

---

# b) Security Group Hardening

Mỗi lớp tài nguyên được đặt trong một Security Group riêng biệt và chỉ cho phép lưu lượng truy cập tối thiểu cần thiết (Least Privilege):

- **ALB Security Group:** Chỉ cho phép nhận traffic HTTP (cổng `80`) và HTTPS (cổng `443`) từ Internet để định tuyến tới các container backend.
- **ECS Security Group:** Chỉ cho phép nhận traffic từ ALB Security Group qua cổng `8000`. Lưu lượng outbound chỉ được phép truy cập cổng `443` (để gọi AWS APIs, AWS Bedrock) và cổng `2049` (để mount EFS).
- **RDS Security Group:** Chỉ cho phép nhận traffic PostgreSQL (cổng `5432`) từ duy nhất ECS Security Group, ngăn chặn mọi kết nối từ bên ngoài.
- **EFS Security Group:** Chỉ cho phép cổng `2049` (NFS) từ duy nhất ECS Security Group để truy cập ổ đĩa chung.

---

# c) Network ACLs Hardening

Thiết lập các quy tắc kiểm soát tại Network ACL (NACL) ở cấp độ Subnet để bổ sung thêm một lớp bảo vệ bên ngoài Security Groups:

- **Subnet Database:** Chặn mọi traffic Inbound/Outbound ngoại trừ kết nối với Subnet ECS qua port `5432`.
- **Subnet ECS (Private):** Chỉ cho phép traffic Inbound từ Subnet Public (ALB) và Outbound đến Subnet Public (NAT Gateway) cùng các cổng dịch vụ HTTPS (`443`) của AWS.
- **Quy tắc chặn mặc định (Default Deny):** Áp dụng rule deny mặc định cho tất cả các port không sử dụng (như SSH `22`, RDP `3389`) từ bên ngoài vào hệ thống.

---

# d) Cảnh báo & Giám sát (Monitoring)

Toàn bộ lưu lượng mạng giữa các Security Groups và Subnets được ghi nhận chi tiết qua VPC Flow Logs và được giám sát thông qua CloudWatch Logs. Điều này giúp phát hiện sớm các hành vi truy cập trái phép hoặc cấu hình sai lệch.

## 4. MH3 — File Storage Layer + Backup Plan (Chia sẻ data, bảo vệ state)

### File Storage - Amazon EFS

#### Cấu hình EFS

![image](https://github.com/user-attachments/assets/5493e7fc-a5d7-48d8-8967-0b411f3e7519)| Thông tin | Chi tiết | | --- | --- | | **Tên** | medecu-efs | | **Region** | ap-southeast-1 | | **Performance Mode** | General Purpose | | **Throughput Mode** | Bursting | | **Encryption at Rest** | ✅ Enabled (KMS) | | **Lifecycle Policy** | Transition to IA after 30 days, Transition into Archive after 90 days |

**Mount Targets:**

| Subnet | AZ | Security Group |
| --- | --- | --- |
| `medecu-ecs-a` | ap-southeast-1a | `medecu-efs-sg` |
| `medecu-ecs-b` | ap-southeast-1b | `medecu-efs-sg` |

**Security Group của Mount Target:**

![image](https://github.com/user-attachments/assets/4b47ac65-932e-4702-a88e-8b50f05b271c)\#### Mount EFS trên ECS

![image](https://github.com/user-attachments/assets/665f60f4-4895-4f54-b0cc-64fc6f41bb02)**Screenshot - EFS Mount Successful:**

![image](https://github.com/user-attachments/assets/8b4178d2-8d5c-4529-a09b-6b84e90b31e7)\#### Write & Read Test

Để xác minh Amazon EFS được mount và hoạt động chính xác giữa nhiều ECS tasks, em thực hiện kiểm tra ghi và đọc dữ liệu thông qua các ECS containers khác nhau.

---

#### ECS Task Definition — Mount Point Configuration

EFS được cấu hình làm shared storage và mount vào ECS containers thông qua task definition.

---

#### Screenshot — ECS Task Definition Mount Point

![image](https://github.com/user-attachments/assets/3c2f652c-91f5-4a1f-81dc-4cc04fbd93f9)**Mô tả screenshot cần capture:**

- ECS Task Definition

- Tab Volumes hoặc Container Definitions

- Hiển thị:

  - EFS volume configuration
  - Mount point `/mnt/efs/shared`
  - EFS filesystem ID

---

#### Verify EFS Mounted trong ECS Container

Em truy cập vào ECS task container đầu tiên và xác nhận EFS đã được mount thành công.

Ví dụ:

```bash
mount | grep efs
```

Hoặc:

```bash
df -h
```

Kết quả cho thấy filesystem EFS đã được mount tại:

```text
/mnt/efs
```

---

#### Screenshot — EFS Mounted in First ECS Container

![image](https://github.com/user-attachments/assets/b73d28ea-592f-4e87-bc08-d2c4373fdaba)**Mô tả screenshot cần capture:**

- terminal bên trong container

- Hiển thị:

  - EFS mounted path
  - Mount information
  - `/mnt/efs`

---

#### Write Test — Tạo file từ ECS Container đầu tiên

Em thực hiện tạo file trực tiếp trên mounted EFS từ ECS container đầu tiên.

Ví dụ:

```bash
echo "Hello from ECS Container 1" > /mnt/efs/shared-test.txt
```

Hoặc:

```bash
touch /mnt/efs/shared-test.txt
```

Việc tạo file thành công xác nhận ECS task có quyền ghi dữ liệu vào EFS.

---

#### Screenshot — Write File to EFS

![image](https://github.com/user-attachments/assets/6c91bc64-f908-496f-aecc-3b2455f3af94)**Mô tả screenshot cần capture:**

- Terminal bên trong ECS container đầu tiên

- Hiển thị:

  - Command tạo file
  - File xuất hiện trong `/mnt/efs`

---

#### Read Test — Đọc file từ ECS Container khác

Sau khi file được tạo từ ECS container đầu tiên, em truy cập vào ECS task container thứ hai để kiểm tra khả năng chia sẻ dữ liệu qua EFS.

Ví dụ:

```bash
cat /mnt/efs/shared-test.txt
```

Expected output:

```text
Hello from ECS Container 1
```

Kết quả cho thấy file được tạo từ container đầu tiên đã xuất hiện và đọc được từ container thứ hai.

Điều này xác nhận:

- EFS đã được mount thành công trên nhiều ECS tasks
- Dữ liệu được chia sẻ real-time giữa các containers
- Amazon EFS hoạt động đúng với mô hình shared persistent storage

---

#### Screenshot — EFS Mounted in Second ECS Container

![image](https://github.com/user-attachments/assets/d3451ef2-2420-4c24-a243-aacbd098aa5d)**Mô tả screenshot cần capture:**

- terminal bên trong container thứ hai

- Hiển thị:

  - `/mnt/efs`
  - Mounted EFS filesystem

---

#### Screenshot — Read File from Second Container

![image](https://github.com/user-attachments/assets/c88e4e3e-a13c-4b67-94d2-9e17fd1b17ac)**Mô tả screenshot cần capture:**

- Terminal bên trong ECS container thứ hai

- Hiển thị:

  - Command:

    ```bash
    cat /mnt/efs/shared-test.txt
    ```

  - Nội dung file đọc được

  - Xác nhận file được share giữa nhiều containers

**Negative security test cho EFS: Không thể mount EFS vào EC2 instance, do security group không cho phép kết nôi từ EC2 Instance.**

![image](https://github.com/user-attachments/assets/f1d36541-4392-4931-bcb1-95fea8d0beea)**Ngược lại, nếu security group của efs cho phép kết nối từ EC2 instance thì có thể mount thành công:**

![image](https://github.com/user-attachments/assets/a0e3bf94-f64d-4dc4-80a5-4d3e64967dd3)\---

## Backup Plan và Restore Verification

### Tổng quan triển khai

Trong phần này, em triển khai AWS Backup để tự động backup các tài nguyên quan trọng của hệ thống nhằm đáp ứng yêu cầu disaster recovery và data protection.

Backup strategy bao gồm:

- AWS Backup Plan tự động chạy theo lịch
- Backup nhiều resource production
- Lưu recovery point trong Backup Vault
- Kiểm tra restore thực tế từ recovery point
- Xác minh dữ liệu sau restore thành công

---

### AWS Backup Plan

#### Backup Plan Information

| Thông tin | Chi tiết |
| --- | --- |
| **Backup Plan Name** | medecu-backup-plan |
| **Backup Vault** | medecu-backup-vault |
| **Status** | ✅ Active |
| **Created Time** | May 14, 2026 |
| **Schedule** | Daily Automatic Backup |
| **Backup Service** | AWS Backup |

Ngoài backup plan chính do em cấu hình, hệ thống còn có automatic backup plan mặc định cho Amazon EFS.

---

#### Existing Backup Plans

| Backup Plan | Type | Status |
| --- | --- | --- |
| **medecu-backup-plan** | Custom Backup Plan | ✅ Active |
| **aws/efs/automatic-backup-plan** | AWS Managed EFS Backup | ✅ Active |

---

#### Screenshot — Backup Plans

![image](https://github.com/user-attachments/assets/eace3225-1072-4188-8533-e97bae74a351)**Mô tả screenshot cần capture:**

- AWS Console → AWS Backup → Backup Plans

- Hiển thị:

  - `medecu-backup-plan`
  - `aws/efs/automatic-backup-plan`

- Hiển thị trạng thái active

- Hiển thị created time

---

### Backup Vault Configuration

#### Backup Vault

| Thông tin | Chi tiết |
| --- | --- |
| **Vault Name** | medecu-backup-vault |
| **Vault Type** | Customer Managed Vault |
| **Status** | ✅ Available |

Backup vault được sử dụng để lưu trữ recovery points của toàn bộ hệ thống.

---

#### Screenshot — Backup Vault

![image](https://github.com/user-attachments/assets/d3728182-daf5-4dd9-95b5-2d2c4161fbe1)**Mô tả screenshot cần capture:**

- AWS Console → AWS Backup → Backup Vaults

- Hiển thị:

  - `medecu-backup-vault`
  - Number of recovery points
  - Vault status

---

### Resource Assignment

AWS Backup được cấu hình để backup nhiều tài nguyên production quan trọng của hệ thống.

#### Resource Assignment Information

| Thông tin | Chi tiết |
| --- | --- |
| **Resource Assignment Name** | medecu-backup-resources |
| **IAM Role** | medecu-backup-service-role |
| **Assignment Method** | ARN-based selection |

---

#### Resources được Backup

| Resource Type | Resource Name | Status |
| --- | --- | --- |
| **EFS** | `medecu-efs` | ✅ Included |
| **RDS** | `medecu-posgres` | ✅ Included |
| **S3** | `medecu-data-source` | ✅ Included |

---

#### Screenshot — Resource Assignment

![image](https://github.com/user-attachments/assets/3d968f7e-2329-4e4e-b8e5-886fc4178ca4)**Mô tả screenshot cần capture:**

- AWS Console → AWS Backup → Protected Resources hoặc Resource Assignments

- Hiển thị:

  - Resource assignment name
  - IAM Role
  - Danh sách resource ARN
  - EFS, RDS, S3 buckets

---

### Backup Rule Configuration

#### Backup Rule

![image](https://github.com/user-attachments/assets/bc248314-4d53-4784-8a18-d5c1ce1202a3)\---

**Mô tả screenshot cần capture:**

| Configuration | Value |
| --- | --- |
| **Backup Rule Name** | medecu-daily-backup |
| **Backup Frequency** | Daily |
| **Backup Time** | 05:00 AM UTC (12:00 PM ICT) |
| **Start Window** | Within 8 hours |
| **Completion Window** | Within 7 days |
| **Backup Vault** | medecu-backup-vault |
| **Continuous Backup** | Enabled |
| **Total Retention Period** | 5 weeks (35 days) |

---

### Recovery Points

Sau khi backup job hoàn thành, AWS Backup tạo recovery points để phục vụ restore khi cần thiết.

#### Recovery Points Information

| Recovery Point | Resource Type | Status |
| --- | --- | --- |
| **EFS Recovery Point** | Amazon EFS | ✅ COMPLETED |
| **RDS Recovery Point** | Amazon RDS | ✅ COMPLETED |
| **S3 Recovery Point** | Amazon S3 | ✅ COMPLETED |

Recovery points được lưu trữ trong `medecu-backup-vault`.

---

#### Screenshot — Recovery Points

![image](https://github.com/user-attachments/assets/73d5acfa-7de9-479b-86f5-20b28bb968ae)**Mô tả screenshot cần capture:**

- AWS Console → AWS Backup → Recovery Points

- Hiển thị:

  - Recovery point IDs
  - Resource type
  - Creation time
  - Status = COMPLETED
  - Backup vault name

---

### Restore Test (Bắt buộc)

Em đã thực hiện restore test từ recovery point để xác minh backup có thể sử dụng thực tế trong disaster recovery scenario.

---

### Restore Job Configuration

#### Restore Target

| Thông tin | Chi tiết |
| --- | --- |
| **Source Resource** | Amazon EFS |
| **Restore Type** | Restore to New Resource |
| **Destination** | New EFS File System |
| **Encryption** | Enabled |
| **Restore Status** | ✅ COMPLETED |

Restore test được thực hiện bằng cách khôi phục EFS từ recovery point sang file system mới.

### Restore Job Result

#### Restore Job Details

| Thông tin | Chi tiết |
| --- | --- |
| **Restore Job Status** | ✅ COMPLETED |
| **Restore Type** | EFS Restore |
| **Verification** | Success |
| **Data Validation** | Passed |

---

#### Screenshot — Restore Job Completed

![image](https://github.com/user-attachments/assets/4ed97c89-4005-4fb0-81fb-a921f96d8f2b)**Mô tả screenshot cần capture:**

- AWS Console → AWS Backup → Restore Jobs

- Hiển thị:

  - Status = COMPLETED
  - Completion time
  - Restored resource information

---

#### Screenshot — Data Before Restore

![image](https://github.com/user-attachments/assets/47997b29-411a-459c-b258-c8b8979c3839)**Mô tả screenshot cần capture:**

- Terminal hoặc file browser trước khi thực hiện restore

- Hiển thị dữ liệu hiện tại của EFS production

- Có xuất hiện file:

  - `ce4b9b45861b_handler.py`

- Thể hiện trạng thái dữ liệu mới hơn recovery point backup

---

#### Screenshot — Data After Restore

![image](https://github.com/user-attachments/assets/4a1bfb2d-db7d-4019-b4bc-39b77ce135b1)**Mô tả screenshot cần capture:**

- Terminal hoặc file browser sau khi restore EFS

- Hiển thị dữ liệu restored từ recovery point

- File:

  - `ce4b9b45861b_handler.py`
  - không xuất hiện trong restored filesystem

- Thể hiện dữ liệu đã được restore đúng theo thời điểm snapshot backup

---

#### Giải thích kết quả Restore Verification

Trước khi thực hiện restore, EFS production hiện tại có chứa file:

```text
ce4b9b45861b_handler.py
```

Tuy nhiên recovery point được tạo trước thời điểm file này tồn tại, do đó snapshot backup không bao gồm file trên.

Khi thực hiện restore, AWS Backup chỉ khôi phục dữ liệu tồn tại tại thời điểm recovery point được tạo vào restored filesystem hoặc restore directory.

Vì vậy:

- File `ce4b9b45861b_handler.py` không xuất hiện trong dữ liệu restored
- Điều này xác nhận restore operation hoạt động chính xác theo snapshot timeline
- Dữ liệu restored phản ánh đúng trạng thái filesystem tại thời điểm backup được tạo

Kết quả này chứng minh:

- Recovery point đã được sử dụng thành công
- AWS Backup restore hoạt động chính xác
- Restore không lấy dữ liệu phát sinh sau thời điểm backup
- Disaster recovery workflow được xác minh thành công

---

## 5. MH4 — API Gateway trước Lambda (Xây dựng API Surface có Authentication và Throttling)

### Tổng quan triển khai

Trong MH4, em đã triển khai API Gateway phía trước Lambda function hiện có nhằm xây dựng một API surface chuẩn hóa cho backend service. Trước khi triển khai MH4, Lambda được gọi trực tiếp từ application code thông qua AWS SDK, chưa có cơ chế authentication, throttling hoặc endpoint public an toàn cho frontend/backend integration.

Lambda được sử dụng trong MH4 là function health check của hệ thống backend.

---

### Lambda Function được sử dụng

| Thông tin | Chi tiết |
| --- | --- |
| **Function Name** | medecu-lambda-healthCheck |
| **Runtime** | Python 3.11 |
| **Handler** | lambda_function.lambda_handler |
| **Mục đích** | Kiểm tra trạng thái backend services |
| **Invocation sau MH4** | Thông qua API Gateway Lambda Proxy Integration |

Function này được sử dụng để trả về trạng thái hoạt động của các backend components và phục vụ monitoring endpoint cho hệ thống.

---

### API Gateway Configuration

#### API Information

| Thông tin | Chi tiết |
| --- | --- |
| **API Type** | REST API |
| **Stage** | prod |
| **Integration Type** | Lambda Proxy Integration |
| **Authentication** | API Key |
| **Throttling** | Usage Plan |
| **CORS** | Enabled |

API Gateway được cấu hình làm public API layer phía trước Lambda function.

---

#### API Routes

| Method | Endpoint | Integration |
| --- | --- | --- |
| GET | `/health` | Lambda Proxy → medecu-lambda-healthCheck |
| GET | `/health-check` | Lambda Proxy → medecu-lambda-healthCheck |

Cả hai endpoint đều được tích hợp thông qua Lambda Proxy Integration.

---

#### Screenshot — API Gateway Overview

![image](https://github.com/user-attachments/assets/4cba441e-f4a8-4f73-9faf-42e1859b4a1e)\##### Mô tả screenshot cần capture

- AWS Console → API Gateway

- Hiển thị tên API

- Hiển thị stage `prod`

- Hiển thị các routes:

  - `/health`
  - `/health-check`

---

# Lambda Proxy Integration

API Gateway được cấu hình sử dụng Lambda Proxy Integration để chuyển toàn bộ request context trực tiếp xuống Lambda function.

## Integration Configuration

| Thông tin | Chi tiết |
| --- | --- |
| **Integration Type** | Lambda Function |
| **Proxy Integration** | Enabled |
| **Target Lambda** | medecu-lambda-healthCheck |

---

## Screenshot — Lambda Proxy Integration

![image](https://github.com/user-attachments/assets/1d745e0e-67d6-46af-acf2-0dc9290c5190)\### Mô tả screenshot cần capture

- API Gateway → Route `/health`

- Tab Integration Request

- Hiển thị:

  - Lambda Function integration
  - Lambda Proxy Integration = Enabled
  - Target Lambda = `medecu-lambda-healthCheck`

---

# Authentication Configuration — API Key

Để bảo vệ API endpoint, em đã cấu hình API Key Authentication trên API Gateway.

Chỉ các request chứa API Key hợp lệ mới có thể truy cập endpoint.

## Authentication Method

| Thông tin | Chi tiết |
| --- | --- |
| **Auth Type** | API Key |
| **API Key Required** | Enabled |
| **Stage Protected** | prod |

---

## Screenshot — API Key Configuration

![image](https://github.com/user-attachments/assets/720547d7-12f8-4e05-92f3-57c9035dcd20)\### Mô tả screenshot cần capture

- API Gateway → Method Request

- Hiển thị:

  - API Key Required = true

Hoặc:

![image](https://github.com/user-attachments/assets/ec98acb1-d05c-483c-8f24-5672d44c7f99)\- Hiển thị API Key đã associate với stage

---

# Throttling Configuration (Usage Plan)

Em đã triển khai Usage Plan để giới hạn request rate và burst capacity nhằm tránh abuse và overload backend Lambda function.

## Usage Plan

| Thông tin | Chi tiết |
| --- | --- |
| **Usage Plan Name** | medecu-health-check-plan |
| **Rate Limit** | 20 requests/second |
| **Burst Limit** | 60 requests |
| **Quota** | 5,000 requests/day |

---

## Screenshot — Usage Plan & Throttling

![image](https://github.com/user-attachments/assets/ff67d374-2945-4d73-bc71-f6ea2ed290b8)\### Mô tả screenshot cần capture

- API Gateway → Usage Plans

- Hiển thị:

  - Rate limit
  - Burst limit
  - Quota
  - Associated stage/API

---

# Evidence Pack — API Authentication Testing

## Test 1 — Authenticated Request (HTTP 200)

Request có chứa API Key hợp lệ sẽ truy cập thành công API Gateway endpoint.

### curl Test

```bash
curl -X GET "https://aws.hungtran.id.vn/health" \
  -H "x-api-key: <valid-api-key>"
```

### Expected Response

```json
HTTP/1.1 200 OK

{
    "status": "healthy",
    "timestamp": "2026-05-15T01:49:33.318781+00:00",
    "service": "ai_agent",
    "checks": {
        "database": {
            "status": "healthy",
            "latency_ms": 358.73,
            "type": "aurora-postgresql"
        },
        "redis": {
            "status": "healthy",
            "latency_ms": 339.75
        },
        "bedrock": {
            "status": "healthy",
            "latency_ms": 442.71,
            "region": "ap-southeast-1",
            "available_models": 93
        },
        "bedrock_kb": {
            "status": "healthy",
            "latency_ms": 371.87,
            "knowledge_base_id": "9OK4SPYXVP",
            "kb_status": "ACTIVE"
        },
        "efs": {
            "status": "healthy",
            "latency_ms": 216.47,
            "mount": "/mnt/efs"
        },
        "main_app": {
            "status": "healthy",
            "latency_ms": 280.01,
            "app_status": "healthy"
        },
        "ecs_services": {
            "status": "healthy",
            "services": {
                "medecu-task-definition-service-4ri0kz65": {
                    "status": "healthy",
                    "running": 6,
                    "desired": 6,
                    "ecs_status": "ACTIVE"
                }
            }
        }
    }
}
```

---

## Screenshot — Authenticated Request Success

![image](https://github.com/user-attachments/assets/9a5a2db5-a748-4087-b0a7-11b958b8da7e)\### Mô tả screenshot cần capture

- Postman

- Hiển thị:

  - curl command
  - HTTP/1.1 200 OK
  - JSON response body

---

# Evidence Pack — Unauthorized Testing

## Test 2 — Unauthenticated Request (HTTP 403)

Request không chứa API Key sẽ bị API Gateway từ chối.

### curl Test

```bash
curl -X GET "https://aws.hungtran.id.vn/health"
```

### Expected Response

```json
HTTP/1.1 403 Forbidden

{
  "message": "Forbidden"
}
```

---

## Screenshot — Unauthenticated Request Blocked

![image](https://github.com/user-attachments/assets/b86378ff-5275-4bd4-9cc5-e2417597b65a)\### Mô tả screenshot cần capture

- Postman

- Hiển thị:

  - curl command không có API Key
  - HTTP/1.1 403 Forbidden
  - Response body `"Forbidden"`

---

## 6. MH5 — Serverless Scaling Pattern (Xử lý tải đúng cách)

### Scaling Pattern đã chọn

**Pattern:** Provisioned Concurrency (Warm Lambda Instances)

### Lý do chọn

Lambda function của hệ thống được sử dụng cho backend health check API và có khả năng nhận request bất kỳ lúc nào từ frontend hoặc monitoring services.

Trong mô hình Lambda mặc định, khi function không được invoke trong một khoảng thời gian, execution environment sẽ bị giải phóng. Request tiếp theo sẽ gây ra **cold start**, làm tăng latency do Lambda phải khởi tạo runtime environment trước khi xử lý request.

Để giảm cold start latency và đảm bảo response time ổn định cho production workload, em triển khai **Provisioned Concurrency** cho Lambda function.

Provisioned Concurrency giúp:

- Giữ sẵn các Lambda execution environments ở trạng thái warm
- Loại bỏ cold start khi có request đến
- Giảm latency cho API response
- Tăng tính ổn định cho production traffic

---

### Lambda Function được áp dụng

| Thông tin | Chi tiết |
| --- | --- |
| **Function Name** | medecu-lambda-healthCheck |
| **Runtime** | Python 3.11 |
| **Scaling Pattern** | Provisioned Concurrency |
| **Provisioned Instances** | 2 |
| **Region** | ap-southeast-1 |

---

### Trạng thái trước khi bật Provisioned Concurrency

Trước khi bật Provisioned Concurrency, Lambda function hoạt động theo mô hình on-demand mặc định.

Khi function không được invoke trong thời gian dài, request tiếp theo sẽ tạo cold start.

---

#### Cold Start Test

### Bước thực hiện

1. Tắt Provisioned Concurrency
2. Chờ Lambda execution environment bị idle
3. Gửi request mới đến Lambda
4. Kiểm tra CloudWatch Logs

---

#### Screenshot — Provisioned Concurrency Disabled

![image](https://github.com/user-attachments/assets/3a63cece-c46e-43c4-b8f2-233fdd3040b0)**Mô tả screenshot cần capture:**

- AWS Console → Lambda → Configuration

- Hiển thị:

  - Provisioned concurrency = Disabled
  - Current concurrency configuration

---

#### Screenshot — Cold Start Invocation

![image](https://github.com/user-attachments/assets/b2d4d3d0-a0c4-4ce7-88e6-ed98af0587ad)**Mô tả screenshot cần capture:**

- Terminal hoặc Postman
- Request đầu tiên đến Lambda sau idle period
- Response time cao hơn bình thường

---

#### CloudWatch Logs — Cold Start Detected

CloudWatch Logs cho thấy Lambda phải khởi tạo execution environment trước khi xử lý request.

Ví dụ log:

```text
INIT_START Runtime Version: python:3.11
INIT_REPORT Init Duration: 1450.32 ms
REPORT RequestId: xxx Duration: 220.11 ms
```

`Init Duration` xuất hiện trong log xác nhận Lambda đã xảy ra cold start.

---

#### Screenshot — Cold Start Logs

![image](https://github.com/user-attachments/assets/727224db-6f4f-4752-afbb-a5a14bfa5143)**Mô tả screenshot cần capture:**

- CloudWatch Logs

- Hiển thị:

  - `INIT_START`
  - `INIT_REPORT`
  - `Init Duration`

- Chứng minh Lambda cold start đã xảy ra

---

### Bật Provisioned Concurrency

Sau khi xác nhận cold start behavior, em tiến hành bật Provisioned Concurrency cho Lambda function.

---

#### Provisioned Concurrency Configuration

| Thông tin | Chi tiết |
| --- | --- |
| **Function Name** | medecu-lambda-healthCheck |
| **Provisioned Concurrency** | 2 |
| **Alias** | prod |
| **Status** | ✅ Enabled |

---

#### AWS CLI Command

```bash
aws lambda put-provisioned-concurrency-config \
  --function-name medecu-lambda-healthCheck \
  --qualifier prod \
  --provisioned-concurrent-executions 2
```

---

#### Screenshot — Provisioned Concurrency Enabled

![image](https://github.com/user-attachments/assets/511ec571-d6b2-4f6b-a475-7a18392757a2)**Mô tả screenshot cần capture:**

- AWS Console → Lambda → Aliases / Concurrency

- Hiển thị:

  - Provisioned concurrency = 2
  - Alias = prod
  - Status = Ready

---

#### Screenshot — Warm Instances Ready

![image](https://github.com/user-attachments/assets/912a78bf-cfe6-42f4-b207-3623eab236da)**Mô tả screenshot cần capture:**

- AWS Console → Lambda

- Hiển thị:

  - Provisioned concurrent executions = 2
  - Allocated provisioned environments
  - Status Ready / Available

---

### Test sau khi bật Provisioned Concurrency

Sau khi bật Provisioned Concurrency, Lambda request được xử lý bởi warm execution environment.

Request không còn gặp cold start.

---

#### CloudWatch Logs — Warm Invocation

Ví dụ log sau khi bật Provisioned Concurrency:

```text
START RequestId: xxx Version: prod
REPORT RequestId: xxx Duration: 85.11 ms
```

CloudWatch Logs không còn xuất hiện:

```text
INIT_REPORT
```

Điều này xác nhận request đã được xử lý bởi warm instance.

---

#### Screenshot — Warm Invocation Logs

![image](https://github.com/user-attachments/assets/5882e104-8e06-4451-a0ac-6f7eff7023b6)**Mô tả screenshot cần capture:**

- CloudWatch Logs

- Hiển thị:

  - Request execution logs
  - Không có `INIT_REPORT`
  - Không có `Init Duration`

- Chứng minh Lambda đã chạy trên warm instance

---

### So sánh trước và sau khi bật Provisioned Concurrency

| Trạng thái | Cold Start | Init Duration | Response Stability |
| --- | --- | --- | --- |
| **Before Provisioned Concurrency** | Có | \~1450 ms | Không ổn định |
| **After Provisioned Concurrency** | Không | 0 ms | Ổn định |

---

### Chi phí Provisioned Concurrency

Provisioned Concurrency được tính phí theo:

```text
Provisioned Concurrency Cost =
Number of Instances × Memory Size × Time × Pricing Rate
```

---

#### Cost Estimation

Cấu hình hiện tại:

| Thông tin | Giá trị |
| --- | --- |
| **Provisioned Instances** | 2 |
| **Memory Allocation** | 512 MB (0.512 GB) |
| **Duration** | 1 hour |
| **Region** | ap-southeast-1 |
| **Pricing Rate** | $0.0000166667 per GB-second |

---

#### Cost Calculation

![image](https://github.com/user-attachments/assets/b2b0cb75-6ec3-463b-9cc7-4832b5c3585e)\`\`\`text 2 × 0.512 × 3600 × 0.0000166667 = approximately $0.061 per hour

```

---

### Pattern Rationale & Production Plan

Provisioned Concurrency phù hợp với production workload của hệ thống vì:

1. Giảm latency cho API request
2. Loại bỏ cold start delay
3. Tăng trải nghiệm người dùng
4. Đảm bảo Lambda luôn sẵn sàng xử lý request

Kế hoạch production:

- Monitor Lambda duration và concurrent executions

- Theo dõi CloudWatch metrics:

  - Duration
  - ConcurrentExecutions
  - ProvisionedConcurrencyUtilization

- Scale provisioned instances nếu traffic tăng

- Kết hợp Auto Scaling cho Provisioned Concurrency trong production environment

---

## 7. Application Carry-Forward Verification

### Ứng dụng vẫn hoạt động end-to-end

## Action 1 — Pipeline Execution

Hệ thống backend ECS vẫn hoạt động ổn định sau khi triển khai W5 hardening components.

Cluster backend đang chạy nhiều ECS tasks đồng thời và service ở trạng thái healthy.

### Screenshot — ECS Pipeline Execution

![image](https://github.com/user-attachments/assets/d07692e3-57cc-4ee9-8b57-e037094dacc9)**Mô tả screenshot cần capture:**

- AWS Console → ECS Cluster

- Hiển thị:

  - Cluster `medecu-clusters`
  - Running tasks
  - Service status = Active
  - ECS tasks đang Running

---

## Action 2 — Bedrock Retrieval

Bedrock retrieval workflow vẫn hoạt động thành công thông qua Lambda integration và Knowledge Base retrieval flow.

### Screenshot — Bedrock Retrieval

![image](https://github.com/user-attachments/assets/716df41c-576c-4201-ae19-97d1d745d9f3)**Mô tả screenshot cần capture:**

- Bedrock Knowledge Base retrieval result

- Hoặc Lambda invoke response

- Hiển thị:

  - Query request
  - Retrieval result
  - Successful response

---

## Action 3 — Database Query

Ứng dụng vẫn truy vấn database thành công sau khi triển khai các hardening components.

### Screenshot — Database Query

![image](https://github.com/user-attachments/assets/65a27f90-f68b-4e71-b30b-0a60b6a9609a)**Mô tả screenshot cần capture:**

- Application query result hoặc SQL client

- Hiển thị:

  - Database query thành công
  - Returned records/data
  - Successful response/result

---

## 8. Bonus - Stretch Goals (Tuỳ chọn)

### 8.1 VPC Reachability Analyzer

AWS Reachability Analyzer was used to validate internet connectivity paths. The public subnet path was successfully reachable, while the private subnet path failed due to routing configuration restrictions.

![image](https://github.com/user-attachments/assets/d0610c9f-e4a0-41b5-a0b2-b142fad9432e)- Reachable Successful Connectivity Validation

  ![image](https://github.com/user-attachments/assets/3956f8d9-fce2-4ae5-ba0c-2df39aa5c475)

- Not Reachable Connectivity Failure Detection

  ![image](https://github.com/user-attachments/assets/294f1876-7da4-46e7-8171-d9669e519541)

### 8.2 Lambda Power Tuning

Em triển khai AWS Lambda Power Tuning để benchmark Lambda function với nhiều mức memory khác nhau nhằm tìm cấu hình tối ưu giữa cost và performance.

Lambda được sử dụng để test:

```text
medecu-lambda-healthCheck
```

---

### Deploy Lambda Power Tuning

AWS Lambda Power Tuning được deploy dưới dạng AWS Step Functions workflow.

#### Screenshot — Deploy Lambda Power Tuning

![image](https://github.com/user-attachments/assets/a29a47d3-d57e-4a9b-b822-fbd21a1163c7)![image](https://github.com/user-attachments/assets/11aaf9cb-1ab5-40da-9884-0367e4570e72)**Mô tả screenshot cần capture:**

- AWS Console → Step Functions

- Hiển thị:

  - Lambda Power Tuning state machine
  - Deployment thành công

---

### Input Configuration

Em tạo file input để benchmark Lambda ở nhiều mức RAM khác nhau.

#### Input File

```json
{
  "lambdaARN": "arn:aws:lambda:ap-southeast-1:<ACCOUNT_ID>:function:medecu-lambda-healthCheck",
  "powerValues": [128, 256, 512, 1024, 1536, 2048],
  "num": 10,
  "payload": {},
  "strategy": "balanced"
}
```

#### Ý nghĩa cấu hình

| Parameter | Ý nghĩa |
| --- | --- |
| **lambdaARN** | Lambda cần benchmark |
| **powerValues** | Các mức RAM cần test |
| **num** | Số lần invoke mỗi mức RAM |
| **payload** | Event gửi vào Lambda |
| **strategy** | Strategy tối ưu (`cost`, `speed`, `balanced`) |

---

#### Screenshot — Power Tuning Input File

![image](https://github.com/user-attachments/assets/1951389a-4fe1-4f3d-999f-4b8c031db2e6)**Mô tả screenshot cần capture:**

- File JSON input

- Hiển thị:

  - lambdaARN
  - powerValues
  - strategy
  - num

---

### Chạy Lambda Power Tuning

Em thực hiện chạy Step Functions workflow với file input đã tạo.

#### Screenshot — Running Power Tuning

![image](https://github.com/user-attachments/assets/d45a185e-efc5-4391-a67b-c13e785e09f8)**Mô tả screenshot cần capture:**

- AWS Step Functions

- Hiển thị:

  - Execution running/completed
  - Workflow states
  - Benchmark progress

---

### Kết quả Power Tuning

#### Screenshot — Power Tuning Result

![image](https://github.com/user-attachments/assets/20a50eb0-c5f0-4714-bb58-516f39f4b2ff)**Mô tả screenshot cần capture:**

- Output graph hoặc visualization

- Hiển thị:

  - Cost vs duration
  - Recommended memory size
  - So sánh performance giữa các mức RAM

---

### Kết quả đạt được

- Benchmark Lambda với nhiều mức memory khác nhau
- So sánh execution duration và estimated cost
- Xác định memory configuration tối ưu theo strategy `balanced`
- Có cơ sở tối ưu Lambda production workload

---

## Summary

| Must-Have | Status | Evidence |
| --- | --- | --- |
| **MH1 - Multi-VPC Connectivity** | ✅ COMPLETED | Single VPC with Multi-AZ + Flow Logs |
| **MH2 - Network Security / SG+NACL** | ✅ COMPLETED | SG + NACL Hardening Rules |
| **MH3 - File Storage + Backup** | ✅ COMPLETED | EFS Mount + Restore Test |
| **MH4 - API Gateway + Auth** | ✅ COMPLETED | 200 OK + 403 Forbidden |
| **MH5 - Serverless Scaling** | ✅ COMPLETED | Provisioned Concurrency + Throttle |

**Application Status:** ✅ Running end-to-end with W5 hardening layer

**Deployment Date:** 03-06-2026

**Verified By:** \[Trainer Name\]

---

## Revision History

| Date | Author | Changes |
| --- | --- | --- |
| 2026-05-14 | medecu | Initial Evidence Pack creation |
| 2026-05-15 | medecu | Added restore test verification |

---

**End of Evidence Pack W5**